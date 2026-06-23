(ns wbr.app.fx-test
  (:require [cljs.test :refer [deftest is]]
            [wbr.app.fx :as fx]))

(deftest json-url-builds-paths
  (is (= "/data/index.json" (fx/json-url :index)))
  (is (= "/data/articles/best-coffee.json" (fx/json-url :article "best-coffee"))))
