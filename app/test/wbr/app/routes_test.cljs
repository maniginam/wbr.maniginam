(ns wbr.app.routes-test
  (:require [cljs.test :refer [deftest is]]
            [reitit.frontend :as rf-fe]
            [wbr.app.routes :as routes]))

(deftest matches-article-route
  (let [m (rf-fe/match-by-path (rf-fe/router routes/routes) "/articles/best-coffee")]
    (is (= {:name :article :params {:slug "best-coffee"}} (routes/match->route m)))))
