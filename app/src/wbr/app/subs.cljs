(ns wbr.app.subs
  (:require [re-frame.core :as rf]))

(rf/reg-sub :articles/index (fn [d _] (:articles/index d)))
(rf/reg-sub :articles/by-slug (fn [d _] (:articles/by-slug d)))
(rf/reg-sub :articles/error (fn [d _] (:articles/error d)))
(rf/reg-sub :route (fn [d _] (:route d)))
