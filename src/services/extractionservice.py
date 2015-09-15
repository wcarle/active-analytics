import argparse
import sys
import logging

from apiclient.errors import HttpError
from apiclient.discovery import build
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from oauth2client.client import AccessTokenRefreshError
from oauth2client.appengine import AppAssertionCredentials
from httplib2 import Http
from datetime import date, timedelta, datetime
from src.entities.pagesnapshot import *
from src.entities.pagehits import *
from src.entities.search import *
from src.entities.pageranking import *
from src.entities.globaltrend import *


logger = logging.getLogger(__name__)
api_key = "AIzaSyCM91rdYyeFuJSS29H_zdQVUVXFc0SoBec"
cache_time = timedelta(days=5)
query_range = timedelta(days=14)
extended_query_range = timedelta(days=60) #Extended query range for search queries to get more results
disable_cache = False
maxRankingURLs = 20


class ExtractionService:
  def __init__ (self, table, date = None):

    if date is not None:
      self.today = date
    else:
      self.today = datetime.today()
    logger.info("date:" + str(self.today))

    urlfetch.set_default_fetch_deadline(60) # Increase url fetch deadline for slow Google Analytics API calls

    self.startdate = self.today - query_range
    self.extended_startdate = self.today - extended_query_range;
    self.expdate = self.today - cache_time

    credentials = AppAssertionCredentials(scope='https://www.googleapis.com/auth/analytics.readonly')
    http_auth = credentials.authorize(Http(memcache))
    self.service = build('analytics', 'v3', http=http_auth, developerKey=api_key)
    self.table_id = table

  def get_page_snapshot(self, pageURL):
    dbSnapshot = PageSnapshot.query(
      ndb.AND(PageSnapshot.url==pageURL, PageSnapshot.date > self.expdate, PageSnapshot.date <= self.today)).fetch(1)

    if disable_cache or len(dbSnapshot) == 0:
      #Next Pages
      nextPages = self.run_query(self.build_navigation_query(pageURL, "previousPagePath", "pagePath"))
      nextPageHits = self.build_page_hit(pageURL, nextPages.get("rows"))

      # #Previous Pages
      # prevPages = self.run_query(self.build_navigation_query(pageURL, "pagePath", "previousPagePath"))
      prevPageHits = [] #self.build_page_hit(pageURL, prevPages.get("rows"))

      # #Dest Pages
      # destPages = self.run_query(self.build_navigation_query(pageURL, "pagePath", "exitPagePath"))
      destPageHits = [] #self.build_page_hit(pageURL, destPages.get("rows"))

      #Search Queries
      searchQueriesResults = self.run_query(self.build_search_query(pageURL))
      searchQueries = self.build_searches(pageURL, searchQueriesResults.get("rows"))

      snap = PageSnapshot(date=self.today, url=pageURL, nextPages=nextPageHits, prevPages=prevPageHits, destPages=destPageHits, searches=searchQueries)
      snap.put()
      return snap
    else:
      return dbSnapshot[0]

  def get_popular_pages(self, url):
    db_snapshot = GlobalTrend.query(
      ndb.AND(GlobalTrend.date > self.expdate, GlobalTrend.date <= self.today)).fetch(1)
    if disable_cache or len(db_snapshot) == 0:
      rankings_query = self.run_query(self.build_global_query())
      rankings = self.build_page_hit("", rankings_query.get("rows"))
      sorted_rankings = sorted(rankings, key=lambda x: x.hits, reverse=True)
      global_trend = GlobalTrend(date=self.today, popular=sorted_rankings)
      global_trend.put()
      return global_trend
    else:
      return db_snapshot[0]

  def get_global_ranking(self, urls):
    page_rankings = []
    if not disable_cache and len(urls) > 0:
      db_rankings = PageRanking.query(ndb.AND(PageRanking.url.IN(urls), PageRanking.date > self.expdate, PageSnapshot.date <= self.today)).fetch()
      for db_ranking in db_rankings:
        if db_ranking.url in urls:
          page_rankings.append(db_ranking)
          urls.remove(db_ranking.url)

    if len(urls) > 0:
      urls = urls[:maxRankingURLs]
      rankings_query = self.run_query(self.build_page_query(urls))
      if rankings_query is not None:
        rankings = self.build_page_hit("", rankings_query.get("rows"))
        bulk_insert = []
        for ranking in rankings:
          #Dont save duplicate results
          if ranking.url in urls:
            create_ranking = PageRanking(date=self.today, url=ranking.url, stats=ranking)
            bulk_insert.append(create_ranking)
            page_rankings.append(create_ranking)
            urls.remove(ranking.url)

        if len(bulk_insert) > 0:
          ndb.put_multi(bulk_insert)

    return sorted(page_rankings, key=lambda x: x.stats.hits, reverse=True)

  def build_page_hit(self, pageURL, rows):
    if rows is None:
      return[]
    PageHitsList = []
    urls = []
    for page in rows:
      if page[0] != pageURL and page[0] not in urls:
        urls.append(page[0])
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
    if rows is None:
      return[]
    keywords = []
    searchQueryList = []
    for query in rows:
      if query[0] not in keywords and int(query[3]) > 1:
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
    return self.service.data().ga().get(
      ids=self.table_id,
      start_date=self.startdate.strftime('%Y-%m-%d'),
      end_date=self.today.strftime('%Y-%m-%d'),
      metrics='ga:pageviews,ga:avgTimeOnPage,ga:exitRate',
      dimensions='ga:' + dimension + ',ga:pageTitle',
      sort='-ga:pageviews',
      filters='ga:' + filter + '==' + url,
      start_index='1',
      max_results='20')

  def build_page_query(self, urls):
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
      start_date=self.startdate.strftime('%Y-%m-%d'),
      end_date=self.today.strftime('%Y-%m-%d'),
      metrics='ga:pageviews,ga:avgTimeOnPage,ga:exitRate',
      dimensions='ga:pagePath,ga:pageTitle',
      sort='-ga:pageviews',
      filters= filters,
      start_index='1',
      max_results=str(len(urls) * 2))

  def build_global_query(self):
    return self.service.data().ga().get(
      ids=self.table_id,
      start_date=self.startdate.strftime('%Y-%m-%d'),
      end_date=self.today.strftime('%Y-%m-%d'),
      metrics='ga:pageviews,ga:avgTimeOnPage,ga:exitRate',
      dimensions='ga:pagePath,ga:pageTitle',
      sort='-ga:pageviews',
      start_index='1',
      max_results='20')

  def build_search_query(self, url):
    """Returns a query object to retrieve data from the Core Reporting API.

    Args:
    service: The service object built by the Google API Python client library.
    table_id: str The table ID form which to retrieve data.
    """
    return self.service.data().ga().get(
      ids=self.table_id,
      start_date=self.extended_startdate.strftime('%Y-%m-%d'),
      end_date=self.today.strftime('%Y-%m-%d'),
      metrics='ga:searchUniques',
      dimensions='ga:searchKeyword,ga:exitPagePath,ga:searchStartPage',
      sort='-ga:searchUniques',
      filters='ga:searchStartPage==' + url,
      start_index='1',
      max_results='20')


