# WBR SPA — Phase 1a (Foundation + Content + Browse + PWA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duplicated static HTML site with a ClojureScript + Reagent/re-frame SPA that serves articles from data and ships as a PWA on the existing AWS S3 + CloudFront host.

**Architecture:** A shadow-cljs SPA (reagent + re-frame + reitit) renders article content built at compile time from markdown + EDN frontmatter. A Babashka content task converts the existing 53 articles to markdown and emits a JSON index + per-article payloads the app fetches. Build-time prerendered HTML shells preserve existing URLs/SEO. Hosting, DNS, and deploy stay on AWS (no host change).

**Tech Stack:** shadow-cljs, ClojureScript, reagent, re-frame, reitit-frontend, markdown-clj, Babashka (content build), cljs.test (app), clojure.test via bb (content), AWS S3 + CloudFront (deploy).

## Global Constraints

- One codebase becomes both web (PWA) and, later, the Capacitor app — keep all app logic platform-agnostic (no Node-only or DOM-only assumptions outside view code).
- Stay on AWS: bucket `wbr.maniginam.dev`, CloudFront distribution `E1GYG7LWHML23S`, region `us-east-1`. Do not migrate hosting.
- The existing static `site/` stays live and untouched until the explicit cutover task; build the SPA in `app/` and deploy only at Task 11.
- Preserve existing article URLs: an article at `site/articles/<slug>.html` must remain reachable at `/articles/<slug>` after cutover.
- Commits: never sign (`--no-gpg-sign`), no Co-Authored-By / attribution footer.
- TDD: every logic change starts with a failing test. Pure logic (content parsing, re-frame events/subs) is unit-tested; view components are smoke-tested via the build.

---

### Task 1: Scaffold the shadow-cljs SPA

**Files:**
- Create: `app/deps.edn`
- Create: `app/shadow-cljs.edn`
- Create: `app/package.json`
- Create: `app/public/index.html`
- Create: `app/src/wbr/app/core.cljs`
- Create: `app/.gitignore`

**Interfaces:**
- Produces: a dev build served at `http://localhost:8020` that mounts a reagent root into `#app` and renders the text `WBR Local`.

- [ ] **Step 1: Create `app/package.json`**

```json
{
  "name": "wbr-app",
  "private": true,
  "devDependencies": {
    "shadow-cljs": "2.28.20"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  }
}
```

- [ ] **Step 2: Create `app/deps.edn`**

```clojure
{:deps {org.clojure/clojure {:mvn/version "1.11.1"}
        org.clojure/clojurescript {:mvn/version "1.11.132"}
        reagent/reagent {:mvn/version "1.2.0"}
        re-frame/re-frame {:mvn/version "1.4.3"}
        metosin/reitit-frontend {:mvn/version "0.7.2"}}
 :paths ["src" "resources"]}
```

- [ ] **Step 3: Create `app/shadow-cljs.edn`**

```clojure
{:deps true
 :dev-http {8020 "public"}
 :builds
 {:app {:target :browser
        :output-dir "public/js"
        :asset-path "/js"
        :modules {:main {:init-fn wbr.app.core/init}}
        :devtools {:http-root "public" :http-port 8020}}
  :test {:target :node-test
         :output-to "out/node-tests.js"}}}
```

- [ ] **Step 4: Create `app/public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WBR Local</title>
</head>
<body>
  <div id="app"></div>
  <script src="/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `app/src/wbr/app/core.cljs`**

```clojure
(ns wbr.app.core
  (:require [reagent.dom.client :as rdomc]))

(defonce root (atom nil))

(defn app []
  [:div "WBR Local"])

(defn init []
  (let [el (.getElementById js/document "app")]
    (reset! root (rdomc/create-root el))
    (rdomc/render @root [app])))
```

- [ ] **Step 6: Create `app/.gitignore`**

```
node_modules/
.shadow-cljs/
public/js/
out/
.cpcache/
```

- [ ] **Step 7: Install + run the dev build**

Run: `cd app && npm install && npx shadow-cljs watch app`
Expected: compile succeeds; visiting `http://localhost:8020` shows `WBR Local`. Stop the watcher (Ctrl-C) once verified.

- [ ] **Step 8: Commit**

```bash
git add app/deps.edn app/shadow-cljs.edn app/package.json app/public/index.html app/src/wbr/app/core.cljs app/.gitignore
git commit --no-gpg-sign -m "feat(app): scaffold shadow-cljs reagent SPA"
```

---

### Task 2: Frontmatter parser (content build)

**Files:**
- Create: `app/src/wbr/content.clj`
- Create: `app/test/wbr/content_test.clj`
- Create: `app/bb.edn`

**Interfaces:**
- Produces: `wbr.content/parse-frontmatter` — `(parse-frontmatter "---\n{:title \"x\"}\n---\nbody") => {:meta {:title "x"} :body "body"}`. Body is everything after the closing `---`, leading newline trimmed. Missing frontmatter returns `{:meta {} :body <input>}`.

- [ ] **Step 1: Create `app/bb.edn`**

```clojure
{:paths ["src" "test"]
 :deps {markdown-clj/markdown-clj {:mvn/version "1.12.1"}}
 :tasks {test {:doc "Run content tests"
               :requires ([clojure.test :as t] [wbr.content-test])
               :task (let [{:keys [fail error]} (t/run-tests 'wbr.content-test)]
                       (System/exit (+ fail error)))}}}
```

- [ ] **Step 2: Write the failing test**

```clojure
(ns wbr.content-test
  (:require [clojure.test :refer [deftest is]]
            [wbr.content :as c]))

(deftest parse-frontmatter-extracts-meta-and-body
  (is (= {:meta {:title "Coffee"} :body "Hello body"}
         (c/parse-frontmatter "---\n{:title \"Coffee\"}\n---\nHello body"))))

(deftest parse-frontmatter-without-frontmatter
  (is (= {:meta {} :body "Just text"}
         (c/parse-frontmatter "Just text"))))
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd app && bb test`
Expected: FAIL — `No namespace: wbr.content` / unresolved `parse-frontmatter`.

- [ ] **Step 4: Write minimal implementation**

```clojure
(ns wbr.content
  (:require [clojure.edn :as edn]
            [clojure.string :as str]))

(defn parse-frontmatter [s]
  (if-let [[_ meta-str body] (re-matches #"(?s)---\n(.*?)\n---\n?(.*)" s)]
    {:meta (edn/read-string meta-str)
     :body (str/triml body)}
    {:meta {} :body s}))
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd app && bb test`
Expected: PASS (0 failures, 0 errors).

- [ ] **Step 6: Commit**

```bash
git add app/src/wbr/content.clj app/test/wbr/content_test.clj app/bb.edn
git commit --no-gpg-sign -m "feat(content): frontmatter parser"
```

---

### Task 3: Markdown→HTML + article record

**Files:**
- Modify: `app/src/wbr/content.clj`
- Modify: `app/test/wbr/content_test.clj`

**Interfaces:**
- Consumes: `wbr.content/parse-frontmatter`.
- Produces: `wbr.content/->article` — `(->article "best-coffee" "---\n{:title \"Coffee\" :category \"Food\"}\n---\n# Hi") => {:slug "best-coffee" :title "Coffee" :category "Food" :html "<h1>Hi</h1>..."}`. `:html` is markdown-clj output of the body. Missing `:title` falls back to the slug.

- [ ] **Step 1: Write the failing test**

```clojure
(deftest ->article-builds-record
  (let [a (c/->article "best-coffee" "---\n{:title \"Coffee\" :category \"Food\"}\n---\n# Hi")]
    (is (= "best-coffee" (:slug a)))
    (is (= "Coffee" (:title a)))
    (is (= "Food" (:category a)))
    (is (re-find #"<h1>Hi</h1>" (:html a)))))

(deftest ->article-title-falls-back-to-slug
  (is (= "my-slug" (:title (c/->article "my-slug" "no frontmatter body")))))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && bb test`
Expected: FAIL — unresolved `->article`.

- [ ] **Step 3: Write minimal implementation (add to `wbr.content`)**

```clojure
(require '[markdown.core :as md])

(defn ->article [slug raw]
  (let [{:keys [meta body]} (parse-frontmatter raw)]
    {:slug slug
     :title (or (:title meta) slug)
     :category (:category meta)
     :summary (:summary meta)
     :updated (:updated meta)
     :html (md/md-to-html-string body)}))
```

Note: move the `markdown.core` require into the `ns` form's `:require` for production cleanliness:
`[markdown.core :as md]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && bb test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/wbr/content.clj app/test/wbr/content_test.clj
git commit --no-gpg-sign -m "feat(content): markdown to article record"
```

---

### Task 4: Index builder + JSON emit

**Files:**
- Modify: `app/src/wbr/content.clj`
- Modify: `app/test/wbr/content_test.clj`
- Modify: `app/bb.edn` (add `content` task)

**Interfaces:**
- Consumes: `wbr.content/->article`.
- Produces:
  - `wbr.content/build-index` — `(build-index [article ...]) => [{:slug :title :category :summary :updated} ...]` (HTML stripped from the index; sorted by `:title`).
  - `wbr.content/build!` — reads `content/articles/*.md`, writes `public/data/index.json` and `public/data/articles/<slug>.json` (`{:meta {...} :html "..."}`), returns the count written.

- [ ] **Step 1: Write the failing test for `build-index`**

```clojure
(deftest build-index-strips-html-and-sorts
  (let [arts [{:slug "b" :title "Beta" :category "X" :html "<p>b</p>"}
              {:slug "a" :title "Alpha" :category "Y" :html "<p>a</p>"}]
        idx (c/build-index arts)]
    (is (= ["Alpha" "Beta"] (map :title idx)))
    (is (not (contains? (first idx) :html)))))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && bb test`
Expected: FAIL — unresolved `build-index`.

- [ ] **Step 3: Implement `build-index` (add to `wbr.content`)**

```clojure
(defn build-index [articles]
  (->> articles
       (map #(select-keys % [:slug :title :category :summary :updated]))
       (sort-by :title)
       vec))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && bb test`
Expected: PASS.

- [ ] **Step 5: Implement `build!` (IO; add to `wbr.content`)**

```clojure
(require '[clojure.java.io :as io])
(require '[cheshire.core :as json]) ;; add cheshire to bb.edn :deps

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
```

- [ ] **Step 6: Add deps + `content` task to `app/bb.edn`**

Add `cheshire/cheshire {:mvn/version "5.13.0"}` to `:deps`, and:

```clojure
content {:doc "Build article JSON from markdown"
         :requires ([wbr.content :as c])
         :task (println "Wrote" (c/build!) "articles")}
```

- [ ] **Step 7: Commit**

```bash
git add app/src/wbr/content.clj app/test/wbr/content_test.clj app/bb.edn
git commit --no-gpg-sign -m "feat(content): index builder + json emit"
```

---

### Task 5: Migrate existing articles to markdown

**Files:**
- Create: `app/scripts/html_to_md.clj`
- Create: `app/content/articles/` (output, 53 `.md` files)

**Interfaces:**
- Consumes: the existing `site/articles/*.html` (article body lives in `<article class="article-content">`, title in `<h1>`).
- Produces: one `content/articles/<slug>.md` per source article, each starting with an EDN frontmatter block (`:title`, `:category`, `:summary`, `:updated`) followed by markdown converted from the article body.

- [ ] **Step 1: Write the conversion script**

```clojure
;; app/scripts/html_to_md.clj  — run with: bb app/scripts/html_to_md.clj
(ns html-to-md
  (:require [clojure.java.io :as io]
            [clojure.string :as str]))

(defn extract [re html] (some-> (re-find re html) second))

(defn html->md [html]
  (-> html
      (str/replace #"(?s)<h2[^>]*>(.*?)</h2>" "\n## $1\n")
      (str/replace #"(?s)<h3[^>]*>(.*?)</h3>" "\n### $1\n")
      (str/replace #"(?s)<strong>(.*?)</strong>" "**$1**")
      (str/replace #"(?s)<em>(.*?)</em>" "*$1*")
      (str/replace #"(?s)<a[^>]*href=\"([^\"]*)\"[^>]*>(.*?)</a>" "[$2]($1)")
      (str/replace #"(?s)<li[^>]*>(.*?)</li>" "\n- $1")
      (str/replace #"(?s)<[^>]+>" "")
      (str/replace #"&amp;" "&") (str/replace #"&middot;" "·")
      (str/replace #"&mdash;" "—") (str/replace #"&rarr;" "→")
      (str/replace #"\n{3,}" "\n\n")
      str/trim))

(defn convert [file]
  (let [html (slurp file)
        slug (str/replace (.getName file) #"\.html$" "")
        title (some-> (extract #"(?s)<h1[^>]*>(.*?)</h1>" html) str/trim)
        body (extract #"(?s)<article class=\"article-content\">(.*?)</article>" html)]
    (when body
      (let [meta {:title title :category nil :summary nil :updated "2026-06"}]
        (spit (str "content/articles/" slug ".md")
              (str "---\n" (pr-str meta) "\n---\n" (html->md body) "\n"))
        slug))))

(defn -main []
  (io/make-parents "content/articles/.keep")
  (let [files (->> (file-seq (io/file "../site/articles"))
                   (filter #(str/ends-with? (.getName %) ".html")))
        done (keep convert files)]
    (println "Converted" (count done) "articles")))

(-main)
```

- [ ] **Step 2: Run the conversion**

Run: `cd app && bb scripts/html_to_md.clj`
Expected: prints `Converted 53 articles`; `content/articles/` contains 53 `.md` files.

- [ ] **Step 3: Spot-check 3 conversions**

Run: `cd app && head -20 content/articles/best-coffee-shops-wbr.md content/articles/best-cajun-food-wbr.md content/articles/best-plumbers-port-allen-wbr.md`
Expected: each starts with an EDN frontmatter block then readable markdown (headings as `##`, no raw HTML tags, no stray entities). Manually fix any article where tables/links are mangled.

- [ ] **Step 4: Build the JSON and verify count**

Run: `cd app && bb content`
Expected: prints `Wrote 53 articles`; `public/data/index.json` exists and `public/data/articles/` has 53 files.

- [ ] **Step 5: Commit**

```bash
git add app/scripts/html_to_md.clj app/content/articles
git commit --no-gpg-sign -m "feat(content): migrate 53 articles to markdown"
```

---

### Task 6: re-frame app-db + load articles index

**Files:**
- Create: `app/src/wbr/app/db.cljs`
- Create: `app/src/wbr/app/events.cljs`
- Create: `app/src/wbr/app/subs.cljs`
- Create: `app/test/wbr/app/events_test.cljs`

**Interfaces:**
- Produces:
  - event `:app/init` — sets `db` to `{:articles/index nil :articles/by-slug {} :route nil}`.
  - event `:articles/index-loaded` — `(fn [db [_ idx]] (assoc db :articles/index idx))`.
  - event `:articles/article-loaded` — `(fn [db [_ slug article]] (assoc-in db [:articles/by-slug slug] article))`.
  - sub `:articles/index` → the index vector; sub `:articles/by-slug` → map.

- [ ] **Step 1: Write the failing test**

```clojure
(ns wbr.app.events-test
  (:require [cljs.test :refer [deftest is]]
            [wbr.app.events :as e]))

(deftest index-loaded-sets-index
  (is (= {:articles/index [{:slug "a"}]}
         (e/index-loaded {} [:articles/index-loaded [{:slug "a"}]]))))

(deftest article-loaded-stores-by-slug
  (is (= {:articles/by-slug {"a" {:html "x"}}}
         (e/article-loaded {} [:articles/article-loaded "a" {:html "x"}]))))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx shadow-cljs compile test && node out/node-tests.js`
Expected: FAIL — `wbr.app.events` not found.

- [ ] **Step 3: Implement db + events + subs**

`app/src/wbr/app/db.cljs`:
```clojure
(ns wbr.app.db)
(def default-db {:articles/index nil :articles/by-slug {} :route nil})
```

`app/src/wbr/app/events.cljs`:
```clojure
(ns wbr.app.events
  (:require [re-frame.core :as rf]
            [wbr.app.db :as db]))

(defn index-loaded [d [_ idx]] (assoc d :articles/index idx))
(defn article-loaded [d [_ slug a]] (assoc-in d [:articles/by-slug slug] a))

(rf/reg-event-db :app/init (fn [_ _] db/default-db))
(rf/reg-event-db :articles/index-loaded index-loaded)
(rf/reg-event-db :articles/article-loaded article-loaded)
```

`app/src/wbr/app/subs.cljs`:
```clojure
(ns wbr.app.subs
  (:require [re-frame.core :as rf]))

(rf/reg-sub :articles/index (fn [d _] (:articles/index d)))
(rf/reg-sub :articles/by-slug (fn [d _] (:articles/by-slug d)))
(rf/reg-sub :route (fn [d _] (:route d)))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx shadow-cljs compile test && node out/node-tests.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/wbr/app/db.cljs app/src/wbr/app/events.cljs app/src/wbr/app/subs.cljs app/test/wbr/app/events_test.cljs
git commit --no-gpg-sign -m "feat(app): re-frame db, events, subs for articles"
```

---

### Task 7: Fetch effects for index + article JSON

**Files:**
- Create: `app/src/wbr/app/fx.cljs`
- Modify: `app/src/wbr/app/events.cljs`
- Create: `app/test/wbr/app/fx_test.cljs`

**Interfaces:**
- Consumes: events `:articles/index-loaded`, `:articles/article-loaded`.
- Produces:
  - `wbr.app.fx/json-url` — `(json-url :index) => "/data/index.json"`, `(json-url :article "x") => "/data/articles/x.json"`.
  - event `:articles/load-index` and `:articles/load-article` (slug) that fetch JSON and dispatch the *-loaded events. Fetch uses an `:http` fx registered with `js/fetch`.

- [ ] **Step 1: Write the failing test for `json-url`**

```clojure
(ns wbr.app.fx-test
  (:require [cljs.test :refer [deftest is]]
            [wbr.app.fx :as fx]))

(deftest json-url-builds-paths
  (is (= "/data/index.json" (fx/json-url :index)))
  (is (= "/data/articles/best-coffee.json" (fx/json-url :article "best-coffee"))))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx shadow-cljs compile test && node out/node-tests.js`
Expected: FAIL — `wbr.app.fx` not found.

- [ ] **Step 3: Implement `fx`**

```clojure
(ns wbr.app.fx
  (:require [re-frame.core :as rf]))

(defn json-url
  ([kind] (case kind :index "/data/index.json"))
  ([kind slug] (case kind :article (str "/data/articles/" slug ".json"))))

(rf/reg-fx
 :http
 (fn [{:keys [url on-success]}]
   (-> (js/fetch url)
       (.then #(.json %))
       (.then #(rf/dispatch (conj on-success (js->clj % :keywordize-keys true)))))))
```

- [ ] **Step 4: Wire load events (add to `wbr.app.events`)**

```clojure
(require '[wbr.app.fx :as fx])

(rf/reg-event-fx
 :articles/load-index
 (fn [_ _] {:http {:url (fx/json-url :index) :on-success [:articles/index-loaded]}}))

(rf/reg-event-fx
 :articles/load-article
 (fn [_ [_ slug]]
   {:http {:url (fx/json-url :article slug) :on-success [:articles/article-loaded slug]}}))
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd app && npx shadow-cljs compile test && node out/node-tests.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/wbr/app/fx.cljs app/src/wbr/app/events.cljs app/test/wbr/app/fx_test.cljs
git commit --no-gpg-sign -m "feat(app): fetch effects for article json"
```

---

### Task 8: Routing (reitit) + route → load dispatch

**Files:**
- Create: `app/src/wbr/app/routes.cljs`
- Modify: `app/src/wbr/app/events.cljs`
- Create: `app/test/wbr/app/routes_test.cljs`

**Interfaces:**
- Produces:
  - `wbr.app.routes/routes` — reitit route data with names `:home` (`/`), `:articles` (`/articles`), `:article` (`/articles/:slug`).
  - `wbr.app.routes/match->route` — `(match->route m) => {:name :article :params {:slug "x"}}`.
  - event `:router/navigated` — `(fn [db [_ route]] (assoc db :route route))`.

- [ ] **Step 1: Write the failing test**

```clojure
(ns wbr.app.routes-test
  (:require [cljs.test :refer [deftest is]]
            [reitit.frontend :as rf-fe]
            [wbr.app.routes :as routes]))

(deftest matches-article-route
  (let [m (rf-fe/match-by-path (rf-fe/router routes/routes) "/articles/best-coffee")]
    (is (= {:name :article :params {:slug "best-coffee"}} (routes/match->route m)))))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx shadow-cljs compile test && node out/node-tests.js`
Expected: FAIL — `wbr.app.routes` not found.

- [ ] **Step 3: Implement routes**

```clojure
(ns wbr.app.routes
  (:require [reitit.frontend :as rf-fe]
            [reitit.frontend.easy :as rfe]
            [re-frame.core :as rf]))

(def routes
  [["/" {:name :home}]
   ["/articles" {:name :articles}]
   ["/articles/:slug" {:name :article}]])

(defn match->route [m]
  {:name (get-in m [:data :name])
   :params (:path-params m)})

(defn start! []
  (rfe/start!
   (rf-fe/router routes)
   (fn [m] (when m (rf/dispatch [:router/navigated (match->route m)])))
   {:use-fragment false}))
```

- [ ] **Step 4: Add `:router/navigated` (to `wbr.app.events`)**

```clojure
(rf/reg-event-db :router/navigated (fn [d [_ route]] (assoc d :route route)))
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd app && npx shadow-cljs compile test && node out/node-tests.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/wbr/app/routes.cljs app/src/wbr/app/events.cljs app/test/wbr/app/routes_test.cljs
git commit --no-gpg-sign -m "feat(app): reitit routing + navigation event"
```

---

### Task 9: Views — list, reader, shell wiring

**Files:**
- Create: `app/src/wbr/app/views.cljs`
- Modify: `app/src/wbr/app/core.cljs`

**Interfaces:**
- Consumes: subs `:articles/index`, `:articles/by-slug`, `:route`; events `:articles/load-index`, `:articles/load-article`; `wbr.app.routes/start!`.
- Produces: `wbr.app.views/root` — dispatches on `:route` `:name` to render home/list/reader; the reader renders article `:html` via `dangerouslySetInnerHTML`.

- [ ] **Step 1: Implement views**

```clojure
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
```

- [ ] **Step 2: Wire core to boot re-frame + routing**

```clojure
(ns wbr.app.core
  (:require [reagent.dom.client :as rdomc]
            [re-frame.core :as rf]
            [wbr.app.events]
            [wbr.app.subs]
            [wbr.app.routes :as routes]
            [wbr.app.views :as views]))

(defonce root (atom nil))

(defn init []
  (rf/dispatch-sync [:app/init])
  (rf/dispatch [:articles/load-index])
  (routes/start!)
  (let [el (.getElementById js/document "app")]
    (reset! root (rdomc/create-root el))
    (rdomc/render @root [views/root])))
```

- [ ] **Step 3: Build content + run dev, verify in browser**

Run: `cd app && bb content && npx shadow-cljs watch app`
Expected: `http://localhost:8020` lists 53 article titles; clicking one navigates to `/articles/<slug>` and renders the article HTML; back/forward work. Stop the watcher once verified.

- [ ] **Step 4: Commit**

```bash
git add app/src/wbr/app/views.cljs app/src/wbr/app/core.cljs
git commit --no-gpg-sign -m "feat(app): article list + reader views with routing"
```

---

### Task 10: PWA — manifest + service worker

**Files:**
- Create: `app/public/manifest.webmanifest`
- Create: `app/public/sw.js`
- Modify: `app/public/index.html`

**Interfaces:**
- Produces: an installable PWA — manifest linked, a service worker registered that caches the app shell + visited article JSON for offline reads.

- [ ] **Step 1: Create `app/public/manifest.webmanifest`**

```json
{
  "name": "WBR Local",
  "short_name": "WBR Local",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0c2340",
  "theme_color": "#0c2340",
  "icons": [
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

- [ ] **Step 2: Create `app/public/sw.js`**

```javascript
const CACHE = 'wbr-v1';
const SHELL = ['/', '/js/main.js', '/data/index.json', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      if (e.request.method === 'GET') caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('/')))
  );
});
```

- [ ] **Step 3: Link manifest + register SW in `app/public/index.html`**

Add inside `<head>`:
```html
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/favicon.svg">
```
Add before `</body>` (after the main script):
```html
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
```

- [ ] **Step 4: Copy the favicon into the app**

Run: `cp site/favicon.svg app/public/favicon.svg`

- [ ] **Step 5: Verify install prompt + offline**

Run: `cd app && npx shadow-cljs release app && bb content` then serve `public/` (`cd app/public && python3 -m http.server 8030`). In Chrome DevTools → Application: manifest shows "WBR Local", a service worker is activated, and re-loading offline still renders the list. Stop the server once verified.

- [ ] **Step 6: Commit**

```bash
git add app/public/manifest.webmanifest app/public/sw.js app/public/index.html app/public/favicon.svg
git commit --no-gpg-sign -m "feat(app): PWA manifest + offline service worker"
```

---

### Task 11: Production build + deploy script (no cutover yet)

**Files:**
- Create: `app/scripts/build.sh`
- Create: `app/scripts/deploy.sh`

**Interfaces:**
- Produces:
  - `app/scripts/build.sh` — runs content build + release compile, producing a deployable `app/public/`.
  - `app/scripts/deploy.sh` — syncs `app/public/` to a **staging prefix** `s3://wbr.maniginam.dev/app/` (NOT root) and prints a preview URL. Root cutover is a separate, later, explicitly-approved step.

- [ ] **Step 1: Create `app/scripts/build.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bb content
npx shadow-cljs release app
echo "Built app/public"
```

- [ ] **Step 2: Create `app/scripts/deploy.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export AWS_ACCESS_KEY_ID="$MANIGINAM_AWS_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$MANIGINAM_AWS_SECRET_KEY"
export AWS_DEFAULT_REGION=us-east-1
aws s3 sync public/ s3://wbr.maniginam.dev/app/ --delete
aws cloudfront create-invalidation --distribution-id E1GYG7LWHML23S --paths "/app/*" >/dev/null
echo "Staged at https://wbr.maniginam.dev/app/"
```

- [ ] **Step 3: Make executable + build**

Run: `cd app && chmod +x scripts/build.sh scripts/deploy.sh && ./scripts/build.sh`
Expected: `Built app/public` with `public/js/main.js` and `public/data/index.json` present.

- [ ] **Step 4: Deploy to staging prefix + verify**

Run: `cd app && ./scripts/deploy.sh`
Expected: prints the staging URL. Note: the SPA uses absolute `/js` and `/data` paths, so the `/app/` staging prefix is for smoke-testing asset upload only; full-path routing is validated at root cutover (separate task). Confirm `https://wbr.maniginam.dev/app/data/index.json` returns the index JSON.

- [ ] **Step 5: Commit**

```bash
git add app/scripts/build.sh app/scripts/deploy.sh
git commit --no-gpg-sign -m "chore(app): build + staging deploy scripts"
```

---

## Deferred to later plans (not in Phase 1a)

- **Cutover:** point root `/` at the SPA, add CloudFront SPA routing (403/404 → `/index.html`), prerendered HTML shells per article route for SEO, redirect old `/articles/<slug>.html` → `/articles/<slug>`, retire the duplicate `site/content/articles/`.
- **Phase 1b:** port hero dashboards/map/alerts (weather, river, traffic-cam map, NWS alerts, burn-ban pill, school rolling-week) into Reagent components.
- **Phase 2:** AWS backend (subscribe Lambda + DynamoDB, EventBridge alert poller, push send).
- **Phase 3:** Capacitor wrap + native push + store submission.

## Self-Review

- **Spec coverage (Phase 1a slice):** SPA scaffold ✔ (T1), articles-as-data ✔ (T2–T5), re-frame state ✔ (T6–T7), routing ✔ (T8), views ✔ (T9), PWA ✔ (T10), AWS deploy staying-put ✔ (T11). Dashboards, backend, app, cutover explicitly deferred with named follow-on plans.
- **Placeholder scan:** none — every code/test step has concrete content; `:summary`/`:category` default to `nil` from frontmatter (defined in T3).
- **Type consistency:** `->article` keys (`:slug :title :category :summary :updated :html`) are consumed unchanged by `build-index` (T4), the article JSON shape `{:meta {...} :html}` written in T4 matches `reader`'s `(get-in a [:meta :title])` + `(:html a)` in T9; `index-loaded`/`article-loaded` signatures match their tests (T6) and dispatches (T7).
- **Known caveat:** the HTML→markdown script (T5) is best-effort; T3 step 3 mandates manual spot-fix of mangled tables/links — acceptable for a one-time migration.
