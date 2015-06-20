from google.appengine.ext import ndb

class UserClick(ndb.Model):
  """Models an individual UserAction"""
  userid = ndb.StringProperty(indexed=True)
  task = ndb.StringProperty()
  taskid = ndb.IntegerProperty()
  aaid = ndb.StringProperty()
  url = ndb.StringProperty()
  href = ndb.StringProperty()
  date = ndb.DateTimeProperty()