(ns wbr.app.events
  (:require [re-frame.core :as rf]
            [wbr.app.db :as db]
            [wbr.app.fx :as fx]))

(defn index-loaded [d [_ idx]] (assoc d :articles/index idx))
(defn article-loaded [d [_ slug a]] (assoc-in d [:articles/by-slug slug] a))

(rf/reg-event-db :app/init (fn [_ _] db/default-db))
(rf/reg-event-db :articles/index-loaded index-loaded)
(rf/reg-event-db :articles/article-loaded article-loaded)
(rf/reg-event-db :router/navigated (fn [d [_ route]] (assoc d :route route)))

(rf/reg-event-fx
 :articles/load-index
 (fn [_ _] {:http {:url (fx/json-url :index) :on-success [:articles/index-loaded]}}))

(rf/reg-event-fx
 :articles/load-article
 (fn [_ [_ slug]]
   {:http {:url (fx/json-url :article slug) :on-success [:articles/article-loaded slug]}}))
