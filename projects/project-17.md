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

Every good controls projects starts with the dynamics. Here I won't derive the dynamics. I will instead link two excellent websites: Matthew Peter Kelly's personal blog and Prof. Russ Tedrake's textbook/course/website. I feel like these two resources have been instrumental in my interest in control. [Here](http://www.matthewpeterkelly.com/tutorials/cartPole/index.html) Matthew Peter Kelly derives the dynamics using rigid body kinematics, while [here](http://underactuated.mit.edu/acrobot.html) Prof. Russ Tedrake uses the Lagrangian. These both yield the same for the dynamics. They can be found in the code for this project. We use Matlab autogen functions to convert these dynamics into a state space equation of the form. 
$$\dot{x} = f(x) + g(x)u$$
Where the state can be described by 

$$x = \begin{Bmatrix} x\\ \dot{x} \end{Bmatrix}$$

First to build some intuition here is a GIF of the system showing a sinusoidal force bring applied. Our goals in preforming control on this cart pole are to 1. stabilize it at its top point and 2. to dynamically flip it up to it's top point. 

INSERT GIF HERE

First I build a simple linear controller which drives the cartpole state to 0. To do this I use a linear quadratic regulator (LQR) controller. An LQR controller minimizes the quadratic cost defined as 
$$x^T(t_1)F(t_1)x(t_1)  + \int\limits_{t_0}^{t_1} \left( x^T Q x + u^T R u + 2 x^T N u \right) dt$$

A controller u = -Kx can be solved for using the continuous time algebraic Riccati equation (CARE). For our purposes we use Matlab built in functions to solve this equation given our system dynamics. Below you can see that our system is surprisingly stable around the top equilibrium point. 

INSERT ANOTHER GIF HERE

However, we still need to find a method to flip our cartpole up. 

