#Active Analytics
from src.controllers.default import MainHandler
from src.controllers.api import SnapshotHandler
from src.controllers.api import RankingHandler
import webapp2

app = webapp2.WSGIApplication([
  ('/', MainHandler),
  ('/snapshot*', SnapshotHandler),
  ('/ranking*', RankingHandler)
], debug=True)