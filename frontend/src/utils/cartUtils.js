export const addToCart = async (productId, quantity, productData, token) => {
    const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            productName: productData.title,
            productPrice: Number(productData.price.replace(/[^0-9.-]+/g, "")),
            quantity: quantity
        })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to add to cart');
    }
    
    return data; // Return the updated cart data
};

export const fetchCart = async (token) => {
    const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
};

export const removeItemFromCart = async (productName, productPrice, token) => {
    try {
        const numericPrice = Number(productPrice);
        if (isNaN(numericPrice)) {
            throw new Error('Invalid price format');
        }

        const response = await fetch('http://localhost:5000/api/cart/remove', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                productName,
                productPrice: numericPrice
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove item');
        }

        return await response.json();
    } catch (error) {
        console.error('Remove Item Error:', {
            productName,
            productPrice,
            error: error.message
        });
        throw error;
    }
};