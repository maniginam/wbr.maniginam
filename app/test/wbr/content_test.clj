(ns wbr.content-test
  (:require [clojure.test :refer [deftest is]]
            [wbr.content :as c]))

(deftest parse-frontmatter-extracts-meta-and-body
  (is (= {:meta {:title "Coffee"} :body "Hello body"}
         (c/parse-frontmatter "---\n{:title \"Coffee\"}\n---\nHello body"))))

(deftest parse-frontmatter-without-frontmatter
  (is (= {:meta {} :body "Just text"}
         (c/parse-frontmatter "Just text"))))

(deftest ->article-builds-record
  (let [a (c/->article "best-coffee" "---\n{:title \"Coffee\" :category \"Food\"}\n---\n# Hi")]
    (is (= "best-coffee" (:slug a)))
    (is (= "Coffee" (:title a)))
    (is (= "Food" (:category a)))
    (is (re-find #"<h1>Hi</h1>" (:html a)))))

(deftest ->article-title-falls-back-to-slug
  (is (= "my-slug" (:title (c/->article "my-slug" "no frontmatter body")))))

(deftest build-index-strips-html-and-sorts
  (let [arts [{:slug "b" :title "Beta" :category "X" :html "<p>b</p>"}
              {:slug "a" :title "Alpha" :category "Y" :html "<p>a</p>"}]
        idx (c/build-index arts)]
    (is (= ["Alpha" "Beta"] (map :title idx)))
    (is (not (contains? (first idx) :html)))))
