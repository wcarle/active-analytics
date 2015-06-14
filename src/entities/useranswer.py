from google.appengine.ext import ndb

class UserAnswer(ndb.Model):
  """Models an individual UserAnswer"""
  userid = ndb.StringProperty(indexed=True)
  questionid = ndb.IntegerProperty()
  question = ndb.StringProperty()
  answer = ndb.StringProperty()