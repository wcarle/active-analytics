#Active Analytics
from controllers.default import MainHandler
from controllers.api import SnapshotHandler
from controllers.api import RankingHandler
import webapp2

app = webapp2.WSGIApplication([
  ('/', MainHandler),
  ('/snapshot*', SnapshotHandler),
  ('/ranking*', RankingHandler)
], debug=True)