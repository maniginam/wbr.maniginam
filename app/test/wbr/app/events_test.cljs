(ns wbr.app.events-test
  (:require [cljs.test :refer [deftest is]]
            [wbr.app.events :as e]))

(deftest index-loaded-sets-index
  (is (= {:articles/index [{:slug "a"}]}
         (e/index-loaded {} [:articles/index-loaded [{:slug "a"}]]))))

(deftest article-loaded-stores-by-slug
  (is (= {:articles/by-slug {"a" {:html "x"}}}
         (e/article-loaded {} [:articles/article-loaded "a" {:html "x"}]))))
