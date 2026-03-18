import { createContext, useEffect, useState } from "react";

import { useNavigate } from 'react-router-dom';
import axios from 'axios'

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '₹';
    const delivery_fee = 99;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false)
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('') // empty string — never a space
    const navigate = useNavigate();

    // ── Silently wipe session when JWT expires or is invalid ──
    const clearExpiredSession = () => {
        localStorage.removeItem('token')
        setToken('')
        setCartItems({})
    }

    // ── Check if a backend response indicates an expired/invalid token ──
    const isAuthError = (message = '') => {
        const m = message.toLowerCase()
        return (
            m.includes('expired') ||
            m.includes('not authorized') ||
            m.includes('invalid token') ||
            m.includes('signup') ||
            m.includes('login')
        )
    }

    const addToCart = async (itemId, size) => {
        if (!size) {
            console.log('No size selected')
            return;
        }

        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);

        if (token) {
            try {
                const response = await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })
                if (!response.data.success && isAuthError(response.data.message)) {
                    clearExpiredSession()
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);

        if (token) {
            try {
                const response = await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } })
                if (!response.data.success && isAuthError(response.data.message)) {
                    clearExpiredSession()
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        }
        return totalAmount;
    }

    const getFinalDeliveryFee = () => {
        return getCartCount() > 1 ? 0 : delivery_fee;
    }

    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list')
            if (response.data.products) {
                setProducts(response.data.products)
            } else {
                console.log(response.data.message)
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token } })
            if (response.data.success) {
                setCartItems(response.data.cartData)
            } else if (isAuthError(response.data.message)) {
                // Token expired — wipe silently, no toast
                clearExpiredSession()
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getProductsData()
    }, [])

    useEffect(() => {
        const savedToken = localStorage.getItem('token')
        if (savedToken && savedToken.trim() !== '') {
            setToken(savedToken)
            getUserCart(savedToken)
        }
    }, [])

    const value = {
        products, currency, delivery_fee,
        getFinalDeliveryFee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, getCartCount, updateQuantity,
        getCartAmount, navigate, backendUrl, setToken, token,
        setCartItems
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;