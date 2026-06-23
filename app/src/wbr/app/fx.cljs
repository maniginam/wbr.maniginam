(ns wbr.app.fx
  (:require [re-frame.core :as rf]))

(defn json-url
  ([kind] (case kind :index "/data/index.json"))
  ([kind slug] (case kind :article (str "/data/articles/" slug ".json"))))

(rf/reg-fx
 :http
 (fn [{:keys [url on-success on-failure]}]
   (-> (js/fetch url)
       (.then (fn [resp]
                (if (.-ok resp)
                  (.json resp)
                  (throw (js/Error. (str "HTTP " (.-status resp)))))))
       (.then #(rf/dispatch (conj on-success (js->clj % :keywordize-keys true))))
       (.catch (fn [err]
                 (js/console.error (str "Failed to fetch " url ": " (.-message err)))
                 (when on-failure
                   (rf/dispatch on-failure)))))))
