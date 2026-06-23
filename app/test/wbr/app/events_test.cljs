(ns wbr.app.events-test
  (:require [cljs.test :refer [deftest is]]
            [re-frame.core :as rf]
            [re-frame.db :as rdb]
            [wbr.app.events :as e]))

(deftest index-loaded-sets-index
  (is (= {:articles/index [{:slug "a"}] :articles/error false}
         (e/index-loaded {} [:articles/index-loaded [{:slug "a"}]]))))

(deftest index-loaded-clears-error
  (is (= {:articles/index [{:slug "a"}] :articles/error false}
         (e/index-loaded {:articles/error true} [:articles/index-loaded [{:slug "a"}]]))))

(deftest article-loaded-stores-by-slug
  (is (= {:articles/by-slug {"a" {:html "x"}} :articles/error false}
         (e/article-loaded {} [:articles/article-loaded "a" {:html "x"}]))))

(deftest article-loaded-clears-error
  (is (= {:articles/by-slug {"a" {:html "x"}} :articles/error false}
         (e/article-loaded {:articles/error true} [:articles/article-loaded "a" {:html "x"}]))))

(deftest load-failed-sets-error
  (rf/dispatch-sync [:app/init])
  (rf/dispatch-sync [:articles/load-failed])
  (is (= true (:articles/error @rdb/app-db))))
