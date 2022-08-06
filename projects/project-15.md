---
layout: project
type: project
image: images/euler_portrait.png
title: Euler Project
permalink: projects/euler
# All dates must be YYYY-MM-DD format!
date: 2022-08-07
labels:
  - Math
  - Python
summary: Project Euler is a compilation of mathematical challenge problems that are intended to be solved using a combination of mathematical elimination and computational brute force. Over the years I have solved several of the problems. They are a great way to get up to speed with a new programming language of choice. 
---

## Project Euler

[Project Euler](https://projecteuler.net/archives) is a compilation of mathematical challenge problems that are intended to be solved using a combination of mathematical elimination and computational brute force. They are super fun problems of varying difficulty. Below I list several of the problems I have solved that I found interesting along with code and a brief explanation. The attached code is unedited and contains many failed attempts for every successful one. 

#[Circular Primes](https://projecteuler.net/problem=35)
Approach: Generate all primes under 10^6 using the Sieve of Eratosthenes (or any other method). Remove numbers which contain a (0,2,4,5,6,8) as if these digits are contain within the prime it cannot be circular. Finally I iterate through the remaining primes checking that the circular rotations of each of them are also prime. [code](https://github.com/swannaiden/euler-code/blob/main/Euler35.ipynb).