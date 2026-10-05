#!/usr/bin/env python3
"""
Generates the architecture diagrams in assets/ as standalone SVG files.

Why generate them? They are the "visual" for each project card. Real
screenshots / demo videos can replace them at any time (see README),
but until then every project still has an accurate diagram of how it
is built. Re-run after editing:  python3 tools/make_diagrams.py
"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")
W, H = 800, 450
C = {"bg": "#0d1117", "box": "#111820", "line": "#63d2ff", "text": "#e8eef4",
     "sub": "#8a9bad", "green": "#00e58a", "warm": "#ff7a45", "grid": "#1b2633"}


def box(b):
    x, y, w, h = b["x"], b["y"], b["w"], b["h"]
    col = C.get(b.get("c", "line"), C["line"])
    sub = b.get("sub", "")
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{C["box"]}" stroke="{col}" stroke-width="1.4"/>'
    ty = y + h / 2 + (-4 if sub else 5)
    s += f'<text x="{x + w / 2}" y="{ty}" text-anchor="middle" fill="{C["text"]}" font-size="13" font-weight="600">{b["t"]}</text>'
    if sub:
        s += f'<text x="{x + w / 2}" y="{ty + 17}" text-anchor="middle" fill="{C["sub"]}" font-size="10.5">{sub}</text>'
    return s


def edge_point(b, other):
    """Point on the border of box b facing box `other`."""
    cx, cy = b["x"] + b["w"] / 2, b["y"] + b["h"] / 2
    ox, oy = other["x"] + other["w"] / 2, other["y"] + other["h"] / 2
    dx, dy = ox - cx, oy - cy
    if abs(dx) * b["h"] > abs(dy) * b["w"]:
        return (b["x"] + (b["w"] if dx > 0 else 0), cy)
    return (cx, b["y"] + (b["h"] if dy > 0 else 0))


def arrow(a, b, label="", dash=False, col="line"):
    x1, y1 = edge_point(a, b)
    x2, y2 = edge_point(b, a)
    d = ' stroke-dasharray="5 4"' if dash else ""
    s = (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{C[col]}" stroke-width="1.5"{d} marker-end="url(#ah-{col})"/>')
    if label:
        s += (f'<text x="{(x1 + x2) / 2}" y="{(y1 + y2) / 2 - 6}" text-anchor="middle" fill="{C["sub"]}" font-size="10">{label}</text>')
    return s


def diagram(name, title, boxes, arrows, note=""):
    grid = "".join(f'<path d="M{i} 0V{H}" stroke="{C["grid"]}" stroke-width="1"/>' for i in range(0, W, 40))
    grid += "".join(f'<path d="M0 {i}H{W}" stroke="{C["grid"]}" stroke-width="1"/>' for i in range(0, H, 40))
    defs = "".join(
        f'<marker id="ah-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0 0L10 5L0 10z" fill="{C[k]}"/></marker>' for k in ("line", "green", "warm"))
    body = "".join(arrow(boxes[a], boxes[b], *rest) for a, b, *rest in [(x[0], x[1], *x[2:]) for x in arrows])
    body += "".join(box(b) for b in boxes)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="ui-monospace,Menlo,monospace" role="img" aria-label="{title}">'
           f'<defs>{defs}</defs><rect width="{W}" height="{H}" fill="{C["bg"]}"/>{grid}'
           f'<text x="28" y="40" fill="{C["line"]}" font-size="12" letter-spacing="2">{title.upper()}</text>'
           f'{body}'
           f'<text x="28" y="{H - 20}" fill="{C["sub"]}" font-size="11">{note}</text></svg>')
    with open(os.path.join(OUT, name), "w") as f:
        f.write(svg)
    print("wrote", name)


def B(x, y, w, h, t, sub="", c="line"):
    return dict(x=x, y=y, w=w, h=h, t=t, sub=sub, c=c)


os.makedirs(OUT, exist_ok=True)

# 1. OSS contribution pipeline --------------------------------------------
diagram("oss-pipeline.svg", "OSS contribution pipeline: two phases, human gate",
        [B(30, 90, 150, 60, "Discover", "OSS infra repos / issues"),
         B(230, 90, 150, 60, "Analyse", "reproduce + root cause"),
         B(430, 90, 150, 60, "Draft fix (Go)", "autonomous phase"),
         B(620, 90, 150, 60, "Human review", "mandatory gate", "warm"),
         B(620, 250, 150, 60, "Publish PR", "manually triggered", "green"),
         B(430, 250, 150, 60, "Upstream CI", "monitored after submit"),
         B(230, 250, 150, 60, "Maintainer review", "merge / iterate", "green"),
         B(30, 250, 150, 60, "Disclose", "AI-assisted, by default", "green")],
        [(0, 1), (1, 2), (2, 3), (3, 4, "approve"), (4, 5), (5, 6), (6, 7, "", True), (5, 2, "fix CI", True, "warm")],
        "Phase 1 drafts. Phase 2 only runs when a human triggers it.")

# 2. Terraform three-tier ----------------------------------------------------
diagram("terraform-three-tier.svg", "Three-tier AWS stack: composed from Terraform modules",
        [B(40, 190, 110, 60, "Internet", "users"),
         B(210, 120, 150, 60, "ALB (AZ-a, AZ-b)", "module: alb", "line"),
         B(210, 260, 150, 60, "Target group", "health checks"),
         B(420, 120, 160, 60, "EC2 ASG", "module: compute / user_data"),
         B(420, 260, 160, 60, "Security groups", "alb -> app -> db", "warm"),
         B(630, 190, 130, 60, "RDS", "module: rds, multi-AZ", "green"),
         B(210, 360, 370, 40, "module: network (VPC, public/private subnets, routes)", "")],
        [(0, 1, "HTTP"), (1, 2), (2, 3), (3, 5, "SQL"), (4, 3, "", True, "warm")],
        "Each module is reusable per environment; state and variables stay separate.")

# 3. Kubernetes + monitoring ---------------------------------------------------
diagram("k8s-monitoring.svg", "Kubernetes deployment, autoscaling and monitoring",
        [B(30, 190, 110, 60, "Client", ""),
         B(190, 190, 140, 60, "NGINX Ingress", "routing"),
         B(380, 190, 120, 60, "Service", "ClusterIP"),
         B(550, 110, 200, 60, "Deployment: pods", "Helm release"),
         B(550, 230, 200, 60, "HPA", "scales 2 -> 5 replicas", "green"),
         B(380, 340, 140, 50, "Prometheus", "scrapes metrics"),
         B(580, 340, 140, 50, "Grafana", "cluster + app dashboards", "green")],
        [(0, 1), (1, 2), (2, 3), (4, 3, "scale", False, "green"), (3, 5, "metrics", True), (5, 6), (5, 4, "CPU", True)],
        "HPA scale-up validated under load; dashboards show cluster and app health.")

# 4. Jenkins CI/CD ---------------------------------------------------------------
diagram("jenkins-cicd.svg", "Jenkins pipeline on AWS: provision, configure, deploy, rollback",
        [B(30, 90, 130, 60, "git push", "Node.js app"),
         B(210, 90, 140, 60, "Jenkins", "pipeline-as-code"),
         B(400, 90, 140, 60, "Terraform", "provision infra"),
         B(590, 90, 160, 60, "Ansible", "configure hosts"),
         B(590, 250, 160, 60, "Deploy", "release artifact", "green"),
         B(400, 250, 140, 60, "Health check", "verify release"),
         B(210, 250, 140, 60, "Rollback", "one step, last good", "warm"),
         B(30, 250, 130, 60, "Live", "healthy release", "green")],
        [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 7, "pass", False, "green"), (5, 6, "fail", True, "warm"), (6, 7, "", True, "warm")],
        "Same pipeline for every run; rollback target is the last known-good release.")

# 5. Ops automation / incident loop -------------------------------------------------
diagram("ops-automation.svg", "Operations automation and incident-response loop",
        [B(30, 90, 170, 60, "Bash / Python", "provision, deploy, health checks"),
         B(260, 90, 160, 60, "Yandex Cloud", "client servers"),
         B(480, 90, 140, 60, "DNS / firewall", "routing, access"),
         B(670, 90, 100, 60, "Alert", "live issue", "warm"),
         B(670, 250, 100, 60, "Triage", "systemd state"),
         B(480, 250, 140, 60, "Root cause", "journald / syslog"),
         B(260, 250, 160, 60, "Remediate", "fix + validate", "green"),
         B(30, 250, 170, 60, "Runbook + script", "makes the fix repeatable", "green")],
        [(0, 1), (1, 2), (2, 3, "", True, "warm"), (3, 4), (4, 5), (5, 6), (6, 7), (7, 0, "feeds back", True, "green")],
        "Every incident ends as a runbook step or an automation change.")
