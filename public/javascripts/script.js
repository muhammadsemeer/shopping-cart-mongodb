const viewImage = (event, image) => {
  if (image === "image1") {
    var prodimage = document.getElementById("prodimage1");
    prodimage.src = URL.createObjectURL(event.target.files[0]);
  } else if (image === "image2") {
    var prodimage = document.getElementById("prodimage2");
    prodimage.src = URL.createObjectURL(event.target.files[0]);
  } else {
    var prodimage = document.getElementById("prodimage3");
    prodimage.src = URL.createObjectURL(event.target.files[0]);
  }
};

const addToCart = (prodId, name) => {
  fetch("/add-to-cart/" + prodId, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.status === "new") {
        alert(name + " added to cart");
        let count = document.getElementById("cartCount").innerHTML;
        count = parseInt(count) + 1;
        document.getElementById("cartCount").innerHTML = count;
      } else if (response.status === "inc") {
        alert(name + " added to cart");
      } else {
        alert("Please Login to complete the action");
        window.location = "/login";
      }
    });
};
const toggleMenu = () => {
  var menu = document.getElementById("menu");
  menu.classList.toggle("active");
};

const changeImage = (imageId, prodId) => {
  var image = document.getElementById(prodId);
  var imageURL = "/images/product-images/" + imageId + prodId + ".jpg";
  image.src = imageURL;
};

const quantity = (cartId, prodId, func, price) => {
  let quantity = document.getElementById(prodId).innerHTML;
  if (quantity == 1 && func === -1) {
    var co = confirm("Do You Want To Delete The Product ?");
    if (co) {
      fetch("/delete-cart-product/" + cartId + "/" + prodId, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((response) => {
          if (response.status) {
            var id = "t" + prodId;
            let item = document.getElementById(id);
            item.style.display = "none";
            let count = document.getElementById("cartCount").innerHTML;
            count = parseInt(count) - 1;
            document.getElementById("cartCount").innerHTML = count;
            let total = document.getElementById("total").innerHTML;
            total = parseFloat(total) - parseInt(quantity) * parseFloat(price);
            document.getElementById("total").innerHTML = total;
          }
        });
    }
  } else {
    fetch("/change-quantity/" + cartId + "/" + prodId + "/" + func, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((response) => {
        if (response) {
          let quantity = document.getElementById(prodId).innerHTML;
          quantity = parseInt(quantity) + 1;
          document.getElementById(prodId).innerHTML = quantity;
          let total = document.getElementById("total").innerHTML;
          total = parseFloat(total) + parseFloat(price);
          document.getElementById("total").innerHTML = total;
        } else {
          let quantity = document.getElementById(prodId).innerHTML;
          quantity = parseInt(quantity) - 1;
          document.getElementById(prodId).innerHTML = quantity;
          let total = document.getElementById("total").innerHTML;
          total = parseFloat(total) - parseFloat(price);
          document.getElementById("total").innerHTML = total;
        }
      });
  }
};

const deleteCartItem = (cartId, prodId, name, price) => {
  var con = confirm("Do You Want to delete " + name + " from Your Cart");
  if (con) {
    fetch("/delete-cart-product/" + cartId + "/" + prodId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.status) {
          var id = "t" + prodId;
          let item = document.getElementById(id);
          item.style.display = "none";
          let quantity = document.getElementById(prodId).innerHTML;
          let count = document.getElementById("cartCount").innerHTML;
          count = parseInt(count) - parseInt(quantity);
          document.getElementById("cartCount").innerHTML = count;
          let total = document.getElementById("total").innerHTML;
          total = parseFloat(total) - parseInt(quantity) * parseFloat(price);
          document.getElementById("total").innerHTML = total;
        }
      });
  }
};

const placeorder = (event) => {
  event.preventDefault();
  var adderss = document.querySelector("input[name=address]").value;
  var mobileno = document.querySelector("input[name=mobileno]").value;
  var pincode = document.querySelector("input[name=pincode]").value;
  var userId = document.querySelector("input[name=userId]").value;
  var payment = document.querySelectorAll("input[name=paymentmethod]");
  var paymentmethod = payment[0].checked ? "COD" : "ONLINE";
  fetch("/place-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: adderss,
      mobileno: mobileno,
      pincode: pincode,
      paymentmethod: paymentmethod,
      userId: userId,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status) {
        alert("Order Placed Sucessfully");
        // window.location = "/myorders";
        window.location = "/";
      }
      // else if (res.status ) {
      //   alert("Your Order is Pending Complete the Payment to the Place Order");
      //   window.location = "/myorders";
      // }
      else {
        window.location = "/login";
      }
    });
};

const validation = (event) => {
  if (event.target[1].value !== event.target[2].value) {
    event.target[2].style.borderColor = "red";
    document.getElementById("error").innerHTML = "Password Doesnot Match";
    return false;
  } else if (
    (event.target[0].value === event.target[1].value) ===
    event.target[2].value
  ) {
    document.getElementById("error").innerHTML =
      "Current Password and New Password is Same";
    return false;
  } else {
    return true;
  }
};

const payOnline = (orderId, amount, paymentmethod) => {
  fetch(`/payment?orderId=${orderId}&amount=${amount}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      razorpayPayment(res, paymentmethod);
    });
};

function razorpayPayment(res, method) {
  var options = {
    key: res.key, // Enter the Key ID generated from the Dashboard
    amount: res.response.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: "INR",
    name: "Galaxieon Shopping",
    description: "Transfer Your Money Securly",
    image: "/images/GALAXIEON CART.png",
    order_id: res.response.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    handler: function (response) {
      verifyPayment(response, res.response, method);
    },
    prefill: {
      name: "",
      email: "",
      contact: "",
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#003AFF",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.on("payment.failed", function (response) {
    alert(
      response.error.reason +
        " on " +
        response.error.step +
        " Payment ID = " +
        response.error.metadata.payment_id +
        " Order ID = " +
        response.error.metadata.order_id
    );
  });
  rzp1.open();
}

function verifyPayment(payment, order, method) {
  fetch("/verifyPayment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payment,
      order,
      method: method,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status) {
        alert("Payment SucessFully");
        location.reload();
      } else {
        alert("Payment Failed Try Again Later");
        location.reload();
      }
    });
}
const cancelOrder = (orderId) => {
  fetch("/cancelorder/" + orderId, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status) {
        alert(
          "Your Order is Canceled if your paid money online the money will refund to account within 5-7 working days"
        );
        document.getElementById(orderId).style.display = "none";
      } else {
        alert("Something Went Wrong!!!!! Try Again Later..");
      }
    });
};
