from google.appengine.ext import ndb

class UserAction(ndb.Model):
  """Models an individual UserAction"""
  userid = ndb.StringProperty(indexed=True)
  task = ndb.StringProperty()
  taskid = ndb.IntegerProperty()
  url = ndb.StringProperty()
  date = ndb.DateTimeProperty()