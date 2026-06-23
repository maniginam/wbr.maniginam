(ns wbr.app.core
  (:require [reagent.dom.client :as rdomc]))

(defonce root (atom nil))

(defn app []
  [:div "WBR Local"])

(defn init []
  (let [el (.getElementById js/document "app")]
    (reset! root (rdomc/create-root el))
    (rdomc/render @root [app])))
