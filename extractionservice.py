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
from pagesnapshot import *
import logging


logger = logging.getLogger(__name__)
api_key = "AIzaSyCM91rdYyeFuJSS29H_zdQVUVXFc0SoBec"
cache_time = timedelta(minutes=60)


class ExtractionService:
	def __init__ (self, table):
		#app engine
		credentials = AppAssertionCredentials(scope='https://www.googleapis.com/auth/analytics.readonly')

		http_auth = credentials.authorize(Http(memcache))
		self.service = build('analytics', 'v3', http=http_auth, developerKey=api_key)
		self.table_id = table
	 
		
	def get_page_snapshot(self, pageURL):

  		expdate = datetime.today() - cache_time
		ss = PageSnapshot.query(PageSnapshot.url==pageURL).order(-PageSnapshot.date).fetch(1)
		
		if len(ss) == 0 or ss[0].date < expdate:
			nextPages = self.run_navigation_query(pageURL)
			nextPageHits = []
			for page in nextPages.get("rows"):
				if page[0] != pageURL:
					nextPageHits.append(
						PageHits(
							url=page[0],
							title=page[1],
							hits=int(page[2]),
							avgTime=float(page[3]),
							exitRate=float(page[4])
							)
						)
			snap = PageSnapshot(url=pageURL, prevPages=nextPageHits)
			snap.put()
		else:
			snap = ss[0]		
		return snap


	def run_navigation_query(self, url):
		# Try to make a request to the API. Print the results or handle errors.
		try:
			query = self.build_navigation_query(url)
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

			
	def build_navigation_query(self, url):
	  """Returns a query object to retrieve data from the Core Reporting API.

	  Args:
	    service: The service object built by the Google API Python client library.
	    table_id: str The table ID form which to retrieve data.
	  """
	  startdate = date.today() - timedelta(days=14)
	  return self.service.data().ga().get(
	      ids=self.table_id,
	      start_date=startdate.strftime('%Y-%m-%d'),
	      end_date=date.today().strftime('%Y-%m-%d'),
	      metrics='ga:pageviews,ga:avgTimeOnPage,ga:exitRate',
	      dimensions='ga:pagePath,ga:pageTitle',
	      sort='-ga:pageviews',
	      filters='ga:PreviousPagePath==' + url,
	      start_index='1',
	      max_results='20')

