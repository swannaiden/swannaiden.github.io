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
summary: Project Euler is a compilation of mathematical challenge problems that are intended to be solved using a combination of mathematical elimination and computational brute force. 
color: blue
---

# Project Euler

[Project Euler](https://projecteuler.net/archives) is a compilation of mathematical challenge problems that are intended to be solved using a combination of mathematical elimination and computational brute force. They are super fun problems of varying difficulty. Below I list several of the problems I have solved that I found interesting along with code and a brief explanation. The attached code is unedited and contains many failed attempts for every successful one. 

### Euler 35 [Circular primes](https://projecteuler.net/problem=35)
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

### Euler 47 [Distinct primes factors](https://projecteuler.net/problem=47)
Approach: As is usual with Euler challenges we start be generating a list of primes. We then write function which finds the prime factorization of a given number.

```python
def getFactors(num):
  factors = []
  index = 0
  maxFact = 900
  # prime factorization algorithm
  while(num not in primes):
    if(num%primes[index]==0):
      factors.append(primes[index])
      num = num / primes[index]
      index = index -1
    index = index + 1
    if(primes[index]> maxFact):
      return [0]
  factors.append(int(num))
  return factors
```

Now that we have a list of numbers and all of their unique factors finding the first four consecutive numbers which each have at least four distinct factors is fairly simple.

```python
for i in range(0,1000000):
  # if number is prime it cannot have four distinct factors
  if(isPrime(i)):
    continue
  # check if four numbers have the property consecutively 
  if(len(getUnqiue(getFactors(i))) == 4):
    if(count == 0):
      consec[count] = i
      count = count+1
    elif(consec[count-1]+1 == i):
      consec[count] = i
      count = count+1
    else:
      count = 0
    if(count == 4):
      break
```
 [code](https://github.com/swannaiden/euler-code/blob/main/euler47.ipynb).

 
### Euler 41 [Pandigital prime](https://projecteuler.net/problem=41)
Approach: We start by generating a list of numbers which satisfy the pandigital property. To reduce the complexity we search ony between 10^6 and 10^7. Then we check each of these numbers for primeness and return the largest one.  [code](https://github.com/swannaiden/euler-code/blob/main/euler41.ipynb).


## Coming Soon
### Euler 36
### Euler 37
### Euler 38
### Euler 40
### Euler 46