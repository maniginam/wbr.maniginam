(ns wbr.content
  (:require [clojure.edn :as edn]
            [clojure.string :as str]
            [markdown.core :as md]))

(defn parse-frontmatter [s]
  (if-let [[_ meta-str body] (re-matches #"(?s)---\n(.*?)\n---\n?(.*)" s)]
    {:meta (edn/read-string meta-str)
     :body (str/triml body)}
    {:meta {} :body s}))

(defn ->article [slug raw]
  (let [{:keys [meta body]} (parse-frontmatter raw)]
    {:slug slug
     :title (or (:title meta) slug)
     :category (:category meta)
     :summary (:summary meta)
     :updated (:updated meta)
     :html (md/md-to-html-string body)}))
