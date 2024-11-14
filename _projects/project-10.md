---
layout: project
type: project
image: images/taycanNobgsmall.png
title: Safe Drone Flight with Time-Varying Backup Controllers
permalink: projects/iros2022
# All dates must be YYYY-MM-DD format!
date: 2022-05-02
labels:
  - Matlab
  - Controls
  - Quadrotors
  - Safety Critical Control
summary: Research conducted in the AMBER lab at Caltech during winter quarter. Extension to research completed over the summer on backup controllers for high speed geofencing. Extends previous work to support multiple agents with multiple backup maneuvers
color: yellow
---

**Abstract:** The weight, space, and power limitations of small aerial vehicles often prevent the application of modern control techniques without significant model simplifications. Moreover,
high-speed agile behavior, such as that exhibited in drone racing, make these simplified models too unreliable for safety-critical control. In this work, we introduce the concept of time-varying backup controllers (TBCs): user-specified maneuvers
combined with backup controllers that generate reference trajectories which guarantee the safety of nonlinear systems. TBCs reduce conservatism when compared to traditional backup
controllers and can be directly applied to multi-agent coordination to guarantee safety. Theoretically, we provide conditions under which TBCs strictly reduce conservatism, describe how
to switch between several TBC’s and show how to embed TBCs in a multi-agent setting. Experimentally, we verify that TBCs safely increase operational freedom when filtering a pilot’s actions and demonstrate robustness and computational
efficiency when applied to decentralized safety filtering of two quadrotors.

Submitted to IROS2022. The paper text will be published [here](https://arxiv.org/abs/2207.05220) if accepted.


<img class="ui image" src="{{ site.baseurl }}/images/frontpicture.png">