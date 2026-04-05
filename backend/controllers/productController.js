import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js";

// Add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestSeller } = req.body

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestSeller: bestSeller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now()
        }

        const product = new productModel(productData);
        await product.save()

        res.json({ success: true, message: "Product Added" })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Edit product
const editProduct = async (req, res) => {
    try {
        const { id, name, description, price, originalPrice, category, subCategory, sizes, bestSeller, existingImages } = req.body

        const existing = JSON.parse(existingImages || '[]')

        const slots = ['image1', 'image2', 'image3', 'image4']
        const finalImages = []

        for (let i = 0; i < slots.length; i++) {
            const newFile = req.files?.[slots[i]]?.[0]
            if (newFile) {
                const result = await cloudinary.uploader.upload(newFile.path, { resource_type: 'image' })
                finalImages.push(result.secure_url)
            } else if (existing[i]) {
                finalImages.push(existing[i])
            }
        }

        const updates = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            bestSeller: bestSeller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: finalImages,
        }

        if (originalPrice === '' || originalPrice === undefined) {
            await productModel.findByIdAndUpdate(id, { $set: updates, $unset: { originalPrice: '' } })
        } else {
            updates.originalPrice = Number(originalPrice)
            await productModel.findByIdAndUpdate(id, { $set: updates })
        }

        res.json({ success: true, message: "Product Updated" })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// List products
const listProduct = async (req, res) => {
    try {
        const products = await productModel.find({});
        res.json({ success: true, products })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Remove product
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Product Removed" })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Single product
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({ success: true, product })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { addProduct, editProduct, listProduct, removeProduct, singleProduct }