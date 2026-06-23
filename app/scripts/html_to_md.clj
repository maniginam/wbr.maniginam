;; app/scripts/html_to_md.clj  — run with: bb scripts/html_to_md.clj  (from app/)
(ns html-to-md
  (:require [clojure.java.io :as io]
            [clojure.string :as str]))

(defn extract [re html] (some-> (re-find re html) second))

(defn decode-entities [s]
  (-> s
      (str/replace #"&amp;" "&")
      (str/replace #"&middot;" "·")
      (str/replace #"&mdash;" "—")
      (str/replace #"&ndash;" "–")
      (str/replace #"&rarr;" "→")
      (str/replace #"&copy;" "©")
      (str/replace #"&ntilde;" "ñ")
      (str/replace #"&#\d+;" "")))

(defn html->md [html]
  (-> html
      (str/replace #"(?s)<h2[^>]*>(.*?)</h2>" "\n## $1\n")
      (str/replace #"(?s)<h3[^>]*>(.*?)</h3>" "\n### $1\n")
      (str/replace #"(?s)<strong>(.*?)</strong>" "**$1**")
      (str/replace #"(?s)<em>(.*?)</em>" "*$1*")
      (str/replace #"(?s)<a[^>]*href=\"([^\"]*)\"[^>]*>(.*?)</a>" "[$2]($1)")
      (str/replace #"(?s)<li[^>]*>(.*?)</li>" "\n- $1")
      (str/replace #"(?s)<[^>]+>" "")
      decode-entities
      (str/replace #"\n{3,}" "\n\n")
      str/trim))

(defn extract-body [html]
  ;; Try several content-wrapper patterns, most specific first
  (or (extract #"(?s)<article class=\"article-content\">(.*?)</article>" html)
      (extract #"(?s)<main class=\"article-content\">(.*?)</main>" html)
      (extract #"(?s)<article>(.*?)</article>" html)))

(defn convert [file]
  (let [html (slurp file)
        slug (str/replace (.getName file) #"\.html$" "")
        title (some-> (extract #"(?s)<h1[^>]*>(.*?)</h1>" html) str/trim decode-entities)
        body (extract-body html)]
    (when body
      (let [meta {:title title :category nil :summary nil :updated "2026-06"}]
        (spit (str "content/articles/" slug ".md")
              (str "---\n" (pr-str meta) "\n---\n" (html->md body) "\n"))
        slug))))

(defn -main []
  (io/make-parents "content/articles/.keep")
  (let [files (->> (.listFiles (io/file "../site/articles"))
                   (filter #(str/ends-with? (.getName %) ".html")))
        done (keep convert files)]
    (println "Converted" (count done) "articles")))

(-main)
