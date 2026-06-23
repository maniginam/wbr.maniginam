(ns wbr.app.fx
  (:require [re-frame.core :as rf]))

(defn json-url
  ([kind] (case kind :index "/data/index.json"))
  ([kind slug] (case kind :article (str "/data/articles/" slug ".json"))))

(rf/reg-fx
 :http
 (fn [{:keys [url on-success]}]
   (-> (js/fetch url)
       (.then #(.json %))
       (.then #(rf/dispatch (conj on-success (js->clj % :keywordize-keys true)))))))
