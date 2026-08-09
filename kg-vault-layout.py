import json, os

V = os.path.expanduser("~/Obsidian/video_engine_kg")
O = V + "/.obsidian"
os.makedirs(O, exist_ok=True)


def rgb(h):
    return int(h.lstrip("#"), 16)


# ---- graph view: colour by CATEGORY first, then by domain inside Video ----
groups = [
    ('path:"Video/00-Start/Recipes"', "#FFD166"),          # gold   — what you make
    ('path:"Video/00-Start/Facets"', "#06D6A0"),           # mint   — cross-bank slices
    ('path:"Video/10-Laws/UGC"', "#E8A33D"),               # amber  — merged laws
    ('path:"Video/10-Laws/Seedance-2.5"', "#FF6B35"),      # orange — model mechanics
    ('path:"Video/10-Laws/Podcast" OR path:"Video/10-Laws/Street" OR path:"Video/10-Laws/Launch"',
     "#E5533D"),                                            # red    — unmerged laws
    ('path:"Video/20-Models"', "#4C8DFF"),                 # blue
    ('path:"Video/30-Problems"', "#C0392B"),               # dark red
    ('path:"Video/40-Fixes"', "#3DD68C"),                  # green
    ('path:"Video/50-Assets"', "#B79CED"),                 # lilac
    ('path:"Video/60-Production"', "#F78FB3"),             # pink
    ('path:"Video/70-Evidence"', "#35C4E8"),               # cyan
    ('path:"Video/00-Start" -path:"Video/00-Start/Recipes" -path:"Video/00-Start/Facets"',
     "#9AA0A6"),                                            # grey   — indexes / domain hubs
    ('path:"Video/90-Reference" OR "_HOME"', "#FFFFFF"),   # white  — hand-written entry points
]

graph = {
    "collapse-filter": False,
    "search": "",
    "showTags": False,
    "showAttachments": False,
    "hideUnresolved": False,
    "showOrphans": True,
    "collapse-color-groups": False,
    "colorGroups": [{"query": q, "color": {"a": 1, "rgb": rgb(c)}} for q, c in groups],
    "collapse-display": False,
    "showArrow": True,
    "textFadeMultiplier": -1.2,   # labels only when zoomed in — 618 nodes of text is unreadable
    "nodeSizeMultiplier": 1.25,
    "lineSizeMultiplier": 0.7,
    "collapse-forces": False,
    "centerStrength": 0.4,
    "repelStrength": 14,          # push the clusters apart so the law island is obvious
    "linkStrength": 0.7,
    "linkDistance": 220,
    "scale": 0.28,
    "close": False,
}
json.dump(graph, open(O + "/graph.json", "w"), indent=2)

# ---- workspace: file tree on the left, Graph View open in the main pane ----
ws = {
    "main": {
        "id": "main-split", "type": "split", "direction": "vertical",
        "children": [{
            "id": "main-tabs", "type": "tabs", "currentTab": 1,
            "children": [
                {"id": "leaf-home", "type": "leaf",
                 "state": {"type": "markdown",
                           "state": {"file": "_HOME.md", "mode": "preview", "source": False},
                           "title": "Home"}},
                {"id": "leaf-graph", "type": "leaf",
                 "state": {"type": "graph", "state": {}, "title": "Graph view"}},
            ],
        }],
    },
    "left": {
        "id": "left-split", "type": "split", "direction": "horizontal", "width": 300,
        "children": [{
            "id": "left-tabs", "type": "tabs", "currentTab": 0,
            "children": [
                {"id": "leaf-files", "type": "leaf",
                 "state": {"type": "file-explorer", "state": {"sortOrder": "alphabetical"},
                           "title": "Files"}},
                {"id": "leaf-search", "type": "leaf",
                 "state": {"type": "search", "state": {"query": "", "matchingCase": False,
                                                       "explainSearch": False,
                                                       "collapseAll": False, "extraContext": False,
                                                       "sortOrder": "alphabetical"},
                           "title": "Search"}},
            ],
        }],
    },
    "right": {
        "id": "right-split", "type": "split", "direction": "horizontal", "width": 300,
        "collapsed": True,
        "children": [{
            "id": "right-tabs", "type": "tabs", "currentTab": 0,
            "children": [
                {"id": "leaf-outline", "type": "leaf",
                 "state": {"type": "outline", "state": {}, "title": "Outline"}},
                {"id": "leaf-backlink", "type": "leaf",
                 "state": {"type": "backlink", "state": {"collapseAll": False,
                                                         "showSearch": False, "searchQuery": "",
                                                         "sortOrder": "alphabetical"},
                           "title": "Backlinks"}},
            ],
        }],
    },
    "active": "leaf-graph",
    "lastOpenFiles": [
        "_HOME.md",
        "Video/_START-HERE.md",
        "Video/90-Reference/_GAPS.md",
        "Video/90-Reference/_FAILURES.md",
        "Video/90-Reference/_COSTS.md",
        "Video/90-Reference/_STATE-OF-ENGINE.md",
    ],
}
json.dump(ws, open(O + "/workspace.json", "w"), indent=2)

json.dump({"attachmentFolderPath": "./", "alwaysUpdateLinks": True,
           "readableLineLength": True, "defaultViewMode": "preview",
           "showFrontmatter": True},
          open(O + "/app.json", "w"), indent=2)

print("graph.json     : %d colour groups" % len(groups))
print("workspace.json : graph view active, file tree open")
