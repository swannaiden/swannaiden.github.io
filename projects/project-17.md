---
layout: project
type: project
image: images/cart_pole.png
title: Comparing Methods of Control for the Cartpole
permalink: projects/cartpole
# All dates must be YYYY-MM-DD format!
date: 2022-08-09
labels:
  - Controls
  - Matlab
  - Machine Learning
summary: In this project I compare several methods of control for the canonical cartpole system including LQR, energy shaping, MPC, and RL. 
---

## Motivation

The cartpole is one of my favorite mechanical systems. Very few systems of such simplicity produce the predictable chaos that is visually interesting. Something about the movement of the cartpole seems natural. Even though most of us have never played with a cartpole before, it seems somehow familiar. Understanding how to control a cartpole is fundamental to some basic human skill, maybe riding a bike. 

The cartpole is a single inverted pendulum attached to a mass with no friction constrained in movement to the axis perpendicular to gravity. A free body diagram of the system is shown below.

<img class="ui image" src="{{ site.baseurl }}/images/cart_pole.svg">


The simplicity of the cartpole made it the perfect system for me to learn new methods of control on. Whenever I try to implement a controller on a more complex system I make it work on the cartpole first. Here I will compare many methods of control including LQR, energy shaping, MPC and reinforcement learning. 

## Dynamics

Every good controls projects starts with the dynamics. Here I won't derive the dynamics. I will instead link two excellent websites: Matthew Peter Kelly's personal blog and Prof. Russ Tedrake's textbook/course/website. I feel like these two resources have been instrumental in my interest in control. [Here]{} Matthew Peter Kelly derives the dynamics using rigid body kinematics, while [here] Prof. Russ Tedrake uses the Lagrangian.

These both yield the following for the dynamics. 


$$\latex \mbox{dynamics}$$