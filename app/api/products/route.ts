import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Product } from "@/lib/models/product"
import { createProductSchema } from "@/lib/validations/product"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let query = { isActive: true }
    if (category) {
      query = { ...query, category }
    }

    const products = await Product.find(query).sort({ createdAt: -1 })

    return NextResponse.json(
      products.map((product) => ({
        id: product._id.toString(),
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        barcode: product.barcode,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt,
      })),
    )
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    const product = new Product(validatedData)
    await product.save()

    return NextResponse.json(
      {
        id: product._id.toString(),
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        barcode: product.barcode,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 })
  }
}
