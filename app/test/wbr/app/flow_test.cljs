(ns wbr.app.flow-test
  (:require [cljs.test :refer [deftest is async]]
            [re-frame.core :as rf]
            [re-frame.db :as rdb]
            ;; side-effect: registers all events, fx, subs
            [wbr.app.events]
            [wbr.app.fx]
            [wbr.app.subs]))

(deftest article-index-load-flow
  (async done
         (let [fake-data    #js [#js {:slug "a" :title "Alpha"}]
               fake-resp    #js {:ok true :json (fn [] (js/Promise.resolve fake-data))}
               orig-fetch   js/fetch]
      ;; Stub js/fetch to return a resolved promise with a fake Response
           (set! js/fetch (fn [_url] (js/Promise.resolve fake-resp)))
      ;; Initialise re-frame app-db to a clean default state
           (rf/dispatch-sync [:app/init])
      ;; Kick off the full flow: event → :http fx → js/fetch → dispatch :articles/index-loaded
           (rf/dispatch-sync [:articles/load-index])
      ;; The :http fx fires a promise chain; let all microtasks + one macrotask tick settle
           (js/setTimeout
            (fn []
              (let [idx (get @rdb/app-db :articles/index)]
                (is (= [{:slug "a" :title "Alpha"}] idx)
                    "app-db :articles/index should be populated after load-index flow"))
         ;; Restore original fetch
              (set! js/fetch orig-fetch)
              (done))
            50))))
