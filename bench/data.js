window.BENCHMARK_DATA = {
  "lastUpdate": 1781624771159,
  "repoUrl": "https://github.com/martsinlabs/csv-pipe",
  "entries": {
    "csv-pipe throughput": [
      {
        "commit": {
          "author": {
            "email": "myroslav@martsinlabs.com",
            "name": "Myroslav Martsin",
            "username": "myromartsin"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6e71a69fb158a98a888f737970b50cd7f76fb66c",
          "message": "Merge pull request #33 from martsinlabs/v2\n\nci: ensure gh-pages exists before the benchmark publish step",
          "timestamp": "2026-06-16T10:45:22-05:00",
          "tree_id": "616215f038e73af033cffa1f02f20cc499618cd8",
          "url": "https://github.com/martsinlabs/csv-pipe/commit/6e71a69fb158a98a888f737970b50cd7f76fb66c"
        },
        "date": 1781624770752,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "encode: small (1k x 3)",
            "value": 4280,
            "unit": "ops/sec"
          },
          {
            "name": "encode: wide (1k x 20)",
            "value": 471,
            "unit": "ops/sec"
          },
          {
            "name": "encode: large (50k x 3)",
            "value": 52,
            "unit": "ops/sec"
          },
          {
            "name": "encode: quote-heavy (5k x 3)",
            "value": 361,
            "unit": "ops/sec"
          },
          {
            "name": "parse: small (1k x 3)",
            "value": 4790,
            "unit": "ops/sec"
          },
          {
            "name": "parse: wide (1k x 20)",
            "value": 519,
            "unit": "ops/sec"
          },
          {
            "name": "parse: large (50k x 3)",
            "value": 43,
            "unit": "ops/sec"
          },
          {
            "name": "parse: quote-heavy (5k x 3)",
            "value": 616,
            "unit": "ops/sec"
          }
        ]
      }
    ]
  }
}