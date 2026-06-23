(ns wbr.app.views
  (:require [re-frame.core :as rf]
            [reitit.frontend.easy :as rfe]))

(defn article-list []
  (let [idx   @(rf/subscribe [:articles/index])
        error @(rf/subscribe [:articles/error])]
    [:div
     [:h1 "WBR Local — Articles"]
     (cond
       (and (nil? idx) error) [:p "Couldn't load articles. Please retry."]
       (nil? idx)             [:p "Loading…"]
       :else (into [:ul]
                   (for [{:keys [slug title]} idx]
                     [:li {:key slug}
                      [:a {:href (rfe/href :article {:slug slug})} title]])))]))

(defn reader [slug]
  (let [a     (get @(rf/subscribe [:articles/by-slug]) slug)
        error @(rf/subscribe [:articles/error])]
    (cond
      (and (nil? a) error) [:p "Couldn't load this article."]
      (nil? a) (do (rf/dispatch [:articles/load-article slug]) [:p "Loading…"])
      :else [:article
             [:h1 (get-in a [:meta :title])]
             [:div {:dangerouslySetInnerHTML {:__html (:html a)}}]])))

(defn root []
  (let [{:keys [name params]} @(rf/subscribe [:route])]
    (case name
      :article  [reader (:slug params)]
      [article-list])))
