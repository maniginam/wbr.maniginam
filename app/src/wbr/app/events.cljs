(ns wbr.app.events
  (:require [re-frame.core :as rf]
            [wbr.app.db :as db]))

(defn index-loaded [d [_ idx]] (assoc d :articles/index idx))
(defn article-loaded [d [_ slug a]] (assoc-in d [:articles/by-slug slug] a))

(rf/reg-event-db :app/init (fn [_ _] db/default-db))
(rf/reg-event-db :articles/index-loaded index-loaded)
(rf/reg-event-db :articles/article-loaded article-loaded)
