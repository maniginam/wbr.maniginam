(ns wbr.content-test
  (:require [clojure.test :refer [deftest is]]
            [wbr.content :as c]))

(deftest parse-frontmatter-extracts-meta-and-body
  (is (= {:meta {:title "Coffee"} :body "Hello body"}
         (c/parse-frontmatter "---\n{:title \"Coffee\"}\n---\nHello body"))))

(deftest parse-frontmatter-without-frontmatter
  (is (= {:meta {} :body "Just text"}
         (c/parse-frontmatter "Just text"))))
