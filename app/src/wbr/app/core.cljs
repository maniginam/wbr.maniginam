(ns wbr.app.core
  (:require [reagent.dom.client :as rdomc]
            [re-frame.core :as rf]
            [wbr.app.events]
            [wbr.app.subs]
            [wbr.app.routes :as routes]
            [wbr.app.views :as views]))

(defonce root (atom nil))

(defn init []
  (rf/dispatch-sync [:app/init])
  (rf/dispatch [:articles/load-index])
  (routes/start!)
  (let [el (.getElementById js/document "app")]
    (reset! root (rdomc/create-root el))
    (rdomc/render @root [views/root])))
