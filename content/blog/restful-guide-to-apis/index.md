---
title: A RESTful Guide to APIs
date: "2020-02-22"
description: "RESTful APIs are one approach to communicating CRUD actions between the client and the server."
---

![Fox lying down](./cover.jpeg)
<p style='text-align: center'>
  <small>
  Photo credit: <a href='https://unsplash.com/@obkim'>Qijin Xu @obkim via Unsplash</a>
  </small>
</p>

Jumping into back-end from front-end (or vice versa) can be intimidating. Sure, both sides are just code in the end, but the technology and practices are different. With back-end, we manage data. With front-end, we manage user experience. But, in between them lies a bridge: the API.


When we write better APIs, we improve our teamwork and our applications.

## What's an API?
On the web, an API (Application Programming Interface) is how the front-end (client) communicates with the back-end (server).

For example, the client may want to display a list of products in a catalogue. So, the client asks the server which products are available. Then, the server answers with the list of products.

On the front-end, we send a **request**. On the back-end, we send a **response**.

This exchange is performed through an API.

## CRUD
With resources, we have four actions: **C**reate, **R**ead, **U**pdate, and **D**elete.

Consider a collection of products:

| Action | Description |
| ------ | ----------- |
| **Create** | Add a product |
| **Read** | Get the details of a product |
| **Update** | Change a product |
| **Delete** | Remove a product |

We can perform these actions on resources through an API.

## RESTful APIs
RESTful APIs are one approach to communicating CRUD actions between the client and the server.

REST (Representational State Transfer) refers to [architectural constraints](https://en.wikipedia.org/wiki/Representational_state_transfer#Architectural_constraints) for web services. However, web APIs may not fulfill all of those constraints, so instead are called REST*ful*.

With RESTful APIs, we use HTTP methods to create, read, update, and delete resources given a [clean URL](https://en.wikipedia.org/wiki/Clean_URL) and a URI (Unique Resource Identifier), like an id (42) or slug (towel).

Specifically, HTTP supports **GET**, **POST**, **PATCH**, **PUT**, and **DELETE** methods.

With a resource:

| Method | Description |
| ------ | ----------- |
| **GET** | Retrieve resource |
| **POST** | Create a new "sub-resource," and return its URI |
| **PATCH** | Update resource with given instructions |
| **PUT** | Replace resource |
| **DELETE** | Delete resource |

With a collection of resources:

| Method | Description |
| ------ | ----------- |
| **GET** | Retrieve all resources|
| **POST** | Create a new resource, and return its URI|
| **PATCH** | Update all resources with given instructions|
| **PUT** | Replace all resources|
| **DELETE** | Delete all resources|

RESTful APIs support CRUD actions on collections and resources.

## JSON:API
There is no standard format for requests, responses, and errors in RESTful APIs. However, I personally like to use [JSON:API](https://jsonapi.org/) for most of my projects.

Each **request** includes an HTTP method, URL, and sometimes instructions.

Each **response** returns an HTTP status code and a JSON object with either `data` or `error` - but never both. Optionally, responses may return a `meta` object to tell us more about the data, such as pagination.

Let's see how to create, read, update, and delete from our products collection.

*(These examples will not cover every possible situation. For thorough details, please refer to the [JSON:API specification](https://jsonapi.org/format/).)*

### GET
To request all products:

```json
GET https://api.example.com/products
```

To respond, we return an array of products:

```json
200 OK

{
  data: [{
    type: "products",
    id: "toaster",
    attributes: {
      name: "Toaster",
      price: 29.99
    }
  }, {
    type: "products",
    id: "alarm-clock",
    attributes: {
      name: "Alarm Clock",
      price: 15.99
    }
  }]
}
```

If there are no products, we respond with an empty array:

```json
200 OK

{
  data: []
}
```

To request a specific product:

```json
GET https://api.example.com/products/toaster
```

To respond, we return the product:

```json
200 OK

{
  data: {
    type: "products",
    id: "toaster",
    attributes: {
      name: "Toaster",
      price: 29.99
    }
  }
}
```

If we cannot find the product, we respond with an error:

```json
404 Not Found

{
  errors: [{
    status: "404",
    detail: "The requested product could not be found."
  }]
}
```

Further, we can sort, filter, and paginate by providing a **query**:

```json
GET https://api.example.com/products?sort=price&filter=0,100&page=5
```

### POST
To request the creation of a product:

```json
POST https://api.example.com/products

{
  data: {
    type: "products",
    attributes: {
      name: "Frying Pan",
      price: 19.99
    }
  }
}
```

To respond, we return the new product with its **id**:

```json
201 Created

{
  data: {
    type: "products",
    id: "frying-pan",
    attributes: {
      name: "Frying Pan",
      price: 19.99
    }
  }
}
```

If we cannot create the product, we respond with an error:

```json
403 Forbidden

{
  errors: [{
    status: "403",
    detail: "You do not have permission to create a product."
  }]
}
```

### PATCH
To request updates to a product, we send the updated values and leave out the ones we do not want to change:

```json
PATCH https://api.example.com/products

{
  data: {
    type: "products",
    id: "toaster",
    attributes: {
      description: "This product has a new description"
    }
  }
}
```

To respond, we return the updated product:

```json
200 OK

{
  data: {
    type: "products",
    id: "toaster",
    attributes: {
      name: "Toaster",
      price: 29.99,
      description: "This product has a new description"
    }
  }
}
```

If we cannot update the product, we respond with an error:

```json
403 Forbidden

{
  errors: [{
    status: "403",
    detail: "You do not have permission to update this product."
  }]
}
```

### PUT
**PUT** is not supported by JSON:API. However, we can mimic **PUT** by providing all attributes to **PATCH**.

### DELETE
To delete a product:

```json
DELETE https://api.example.com/products/toaster
```

To respond, we simply confirm with no content:

```json
204 No Content
```

If we cannot delete the product, we respond with an error:

```json
403 Forbidden

{
  errors: [{
    status: "403",
    detail: "You do not have permission to delete this product."
  }]
}
```

### Error Handling
When an error occurs, we respond with the HTTP status code and an array of errors containing `status`, `details`, and [other attributes](https://jsonapi.org/format/#error-objects).

## Final Thoughts
As developers, we often place ourselves on either the front-end or back-end. It is very easy to stick to the side we prefer, where we are comfortable, but as a result we limit our breadth of skills. Learning to build RESTful APIs is a great opportunity to expand our skills to the other side.

Ultimately, writing better APIs improves our teamwork and our applications.

## Further Reading
- [RESTful API Design - Step by Step Guide](https://hackernoon.com/restful-api-design-step-by-step-guide-2f2c9f9fcdbf)
- [RESTful API Design - Put vs PATCH](https://medium.com/backticks-tildes/restful-api-design-put-vs-patch-4a061aa3ed0b)
- [JSON:API specification](https://jsonapi.org/format/)
