import argparse
import sys

from apiclient.errors import HttpError
from apiclient import sample_tools
from google.appengine.api import memcache
from apiclient.discovery import build
from oauth2client.client import AccessTokenRefreshError
from oauth2client.appengine import AppAssertionCredentials
from httplib2 import Http
from datetime import date, timedelta, datetime
from src.entities.pagesnapshot import *
from src.entities.pagehits import *
from src.entities.search import *
from src.entities.pageranking import *
import logging


logger = logging.getLogger(__name__)
api_key = "AIzaSyCM91rdYyeFuJSS29H_zdQVUVXFc0SoBec"
cache_time = timedelta(minutes=60)
query_range = timedelta(days=14)
disable_cache = False

class ExtractionService:
  def __init__ (self, table):
    #app engine
    credentials = AppAssertionCredentials(scope='https://www.googleapis.com/auth/analytics.readonly')

    http_auth = credentials.authorize(Http(memcache))
    self.service = build('analytics', 'v3', http=http_auth, developerKey=api_key)
    self.table_id = table
   
    
  def get_page_snapshot(self, pageURL):

    expdate = datetime.today() - cache_time
    dbSnapshot = PageSnapshot.query(ndb.AND(PageSnapshot.url==pageURL, PageSnapshot.date > expdate)).fetch(1)
    
    if disable_cache or len(dbSnapshot) == 0:
      #Next Pages
      nextPages = self.run_query(self.build_navigation_query(pageURL, "previousPagePath", "pagePath"))
      nextPageHits = self.build_page_hit(pageURL, nextPages.get("rows"))

      #Previous Pages
      prevPages = self.run_query(self.build_navigation_query(pageURL, "pagePath", "previousPagePath"))
      prevPageHits = self.build_page_hit(pageURL, prevPages.get("rows"))
      

      #Dest Pages
      destPages = self.run_query(self.build_navigation_query(pageURL, "pagePath", "exitPagePath"))
      destPageHits = self.build_page_hit(pageURL, destPages.get("rows"))
      
      #Search Queries
      searchQueriesResults = self.run_query(self.build_search_query(pageURL))
      searchQueries = self.build_searches(pageURL, searchQueriesResults.get("rows"))

      snap = PageSnapshot(url=pageURL, nextPages=nextPageHits, prevPages=prevPageHits, destPages=destPageHits, searches=searchQueries)
      snap.put()
    else:
      snap = dbSnapshot[0]    
    return snap

  def get_global_ranking(self, urls):

    expdate = datetime.today() - cache_time
    pageRankings = []
    if not disable_cache and len(urls) > 0:
      dbRankings = PageRanking.query(ndb.AND(PageRanking.url.IN(urls), PageRanking.date > expdate)).fetch()
      for dbRanking in dbRankings:
        if dbRanking.url in urls:
          pageRankings.append(dbRanking)
          urls.remove(dbRanking.url)

    if len(urls) > 0:
      rankingsQuery = self.run_query(self.build_page_query(urls))
      rankings = self.build_page_hit("", rankingsQuery.get("rows"))
      bulkInsert = []
      for ranking in rankings:
        #Dont save duplicate results
        if ranking.url in urls:
          createRanking = PageRanking(url=ranking.url, stats=ranking)
          bulkInsert.append(createRanking)
          pageRankings.append(createRanking)
          urls.remove(ranking.url)

      if len(bulkInsert) > 0:
        ndb.put_multi(bulkInsert)

    return sorted(pageRankings, key=lambda x: x.stats.hits, reverse=True)

  def build_page_hit(self, pageURL, rows):
    if rows is None:
      return[]
    PageHitsList = []
    for page in rows:
      if page[0] != pageURL:
        PageHitsList.append(
          PageHits(
            url=page[0],
            title=page[1],
            hits=int(page[2]),
            avgTime=float(page[3]),
            exitRate=float(page[4])
            )
          )
    return PageHitsList
  def build_searches(self, pageURL, rows):
    keywords = []
    searchQueryList = []
    for query in rows:
      if query[0] not in keywords:
        keywords.append(query[0])
        searchQueryList.append(
          Search(
            url=pageURL,
            keyword=query[0],
            destURL=query[1],
            hits=int(query[3])
            )
          )
        
    return searchQueryList
  def run_query(self, query):
    # Try to make a request to the API. Print the results or handle errors.
    try:
      results = query.execute()    
      return results
    except TypeError, error:
      # Handle errors in constructing a query.
      logger.info('There was an error in constructing your query : %s' % error)

    except HttpError, error:
      # Handle API errors.
      logger.info('Arg, there was an API error : %s : %s' %
        (error.resp.status, error._get_reason()))

    except AccessTokenRefreshError:
      # Handle Auth errors.
      logger.info('The credentials have been revoked or expired, please re-run '
        'the application to re-authorize')

      
  def build_navigation_query(self, url, filter, dimension):
    """Returns a query object to retrieve data from the Core Reporting API.

    Args:
    service: The service object built by the Google API Python client library.
    table_id: str The table ID form which to retrieve data.
    """
    startdate = date.today() - query_range
    return self.service.data().ga().get(
      ids=self.table_id,
      start_date=startdate.strftime('%Y-%m-%d'),
      end_date=date.today().strftime('%Y-%m-%d'),
      metrics='ga:pageviews,ga:avgTimeOnPage,ga:exitRate',
      dimensions='ga:' + dimension + ',ga:pageTitle',
      sort='-ga:pageviews',
      filters='ga:' + filter + '==' + url,
      start_index='1',
      max_results='20')

  def build_page_query(self, urls):
    startdate = date.today() - query_range
    filters = ""
    first = True
    for url in urls:
      if first:
        first = False
      else:
        filters += ","
      filters += "ga:pagePath==" + url
    return self.service.data().ga().get(
      ids=self.table_id,
      start_date=startdate.strftime('%Y-%m-%d'),
      end_date=date.today().strftime('%Y-%m-%d'),
      metrics='ga:pageviews,ga:avgTimeOnPage,ga:exitRate',
      dimensions='ga:pagePath,ga:pageTitle',
      sort='-ga:pageviews',
      filters= filters,
      start_index='1',
      max_results=str(len(urls) * 2))

  def build_search_query(self, url):
    """Returns a query object to retrieve data from the Core Reporting API.

    Args:
    service: The service object built by the Google API Python client library.
    table_id: str The table ID form which to retrieve data.
    """
    startdate = date.today() - query_range
    return self.service.data().ga().get(
      ids=self.table_id,
      start_date=startdate.strftime('%Y-%m-%d'),
      end_date=date.today().strftime('%Y-%m-%d'),
      metrics='ga:searchUniques',
      dimensions='ga:searchKeyword,ga:exitPagePath,ga:searchStartPage',
      sort='-ga:searchUniques',
      filters='ga:searchStartPage==' + url,
      start_index='1',
      max_results='20')


