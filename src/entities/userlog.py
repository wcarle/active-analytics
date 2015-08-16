from google.appengine.ext import ndb

class UserLog(ndb.Model):
  """Models an individual UserLog"""
  first_name = ndb.StringProperty(indexed=False)
  last_name = ndb.StringProperty(indexed=False)
  nnumber = ndb.StringProperty(indexed=True)
  date = ndb.DateTimeProperty()

