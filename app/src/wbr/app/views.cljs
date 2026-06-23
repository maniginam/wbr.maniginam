(ns wbr.app.views
  (:require [re-frame.core :as rf]
            [reitit.frontend.easy :as rfe]))

(defn article-list []
  (let [idx @(rf/subscribe [:articles/index])]
    [:div
     [:h1 "WBR Local — Articles"]
     (if (nil? idx)
       [:p "Loading…"]
       (into [:ul]
             (for [{:keys [slug title]} idx]
               [:li {:key slug}
                [:a {:href (rfe/href :article {:slug slug})} title]])))]))

(defn reader [slug]
  (let [a (get @(rf/subscribe [:articles/by-slug]) slug)]
    (if (nil? a)
      (do (rf/dispatch [:articles/load-article slug]) [:p "Loading…"])
      [:article
       [:h1 (get-in a [:meta :title])]
       [:div {:dangerouslySetInnerHTML {:__html (:html a)}}]])))

(defn root []
  (let [{:keys [name params]} @(rf/subscribe [:route])]
    (case name
      :article  [reader (:slug params)]
      [article-list])))
