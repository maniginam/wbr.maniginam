(ns wbr.app.routes
  (:require [reitit.frontend :as rf-fe]
            [reitit.frontend.easy :as rfe]
            [re-frame.core :as rf]))

(def routes
  [["/" {:name :home}]
   ["/articles" {:name :articles}]
   ["/articles/:slug" {:name :article}]])

(defn match->route [m]
  {:name (get-in m [:data :name])
   :params (:path-params m)})

(defn start! []
  (rfe/start!
   (rf-fe/router routes)
   (fn [m] (when m (rf/dispatch [:router/navigated (match->route m)])))
   {:use-fragment false}))
