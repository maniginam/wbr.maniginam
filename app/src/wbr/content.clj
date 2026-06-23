(ns wbr.content
  (:require [clojure.edn :as edn]
            [clojure.string :as str]))

(defn parse-frontmatter [s]
  (if-let [[_ meta-str body] (re-matches #"(?s)---\n(.*?)\n---\n?(.*)" s)]
    {:meta (edn/read-string meta-str)
     :body (str/triml body)}
    {:meta {} :body s}))
