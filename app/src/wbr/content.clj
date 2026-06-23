(ns wbr.content
  (:require [clojure.edn :as edn]
            [clojure.string :as str]
            [clojure.java.io :as io]
            [cheshire.core :as json]
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

(defn build-index [articles]
  (->> articles
       (map #(select-keys % [:slug :title :category :summary :updated]))
       (sort-by :title)
       vec))

(defn- slug-of [file]
  (str/replace (.getName file) #"\.md$" ""))

(defn build! []
  (let [dir (io/file "content/articles")
        files (filter #(str/ends-with? (.getName %) ".md") (.listFiles dir))
        articles (mapv #(->article (slug-of %) (slurp %)) files)]
    (io/make-parents "public/data/articles/.keep")
    (spit "public/data/index.json" (json/generate-string (build-index articles)))
    (doseq [a articles]
      (spit (str "public/data/articles/" (:slug a) ".json")
            (json/generate-string {:meta (dissoc a :html) :html (:html a)})))
    (count articles)))
