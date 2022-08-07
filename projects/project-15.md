---
layout: project
type: project
image: images/euler_cover.webp
title: Euler Project Submissions
permalink: projects/euler
# All dates must be YYYY-MM-DD format!
date: 2022-08-07
labels:
  - Math
  - Python
summary: Project Euler is a compilation of mathematical challenge problems that are intended to be solved using a combination of mathematical elimination and computational brute force. Over the years I have solved several of the problems. They are a great way to get up to speed with a new programming language of choice. 
---

# Project Euler

[Project Euler](https://projecteuler.net/archives) is a compilation of mathematical challenge problems that are intended to be solved using a combination of mathematical elimination and computational brute force. They are super fun problems of varying difficulty. Below I list several of the problems I have solved that I found interesting along with code and a brief explanation. The attached code is unedited and contains many failed attempts for every successful one. 

### Euler 35 [Circular Primes](https://projecteuler.net/problem=35)
Approach: Generate all primes under 10^6 using the Sieve of Eratosthenes (or any other method). Remove numbers which contain a (0,2,4,5,6,8) as if these digits are contained within the prime it cannot be circular. Finally I iterate through the remaining primes checking that the circular rotations of each of them are also prime. [code](https://github.com/swannaiden/euler-code/blob/main/Euler35.ipynb).

```python

circs = []
for prime in primes:

  #iterate over every possible valid prime
  l = list(str(prime))

  isCirc = True
  for i in range(0,len(str(prime))):
    #now iterate over every possible circular rotation
    l.append(l.pop(0))
    #convert l into a number
    num = 0
    for j in range(0,len(l)):
      num = num+10**(len(l)-1-j)*int(l[j])
    # check to see if this number is prime
    if(num not in primes):
      isPrime = False
      break
  if(isPrime):
    circs.append(prime)

# print out the number of circular primes
print(len(circs2))

```

### Euler 