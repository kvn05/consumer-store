"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCartIcon, Plus, Minus, Trash2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import SuccessModal from "@/components/modals/success-modal"
import type { Student, CartItem } from "@/lib/types"

interface ShoppingCartProps {
  selectedStudent: Student | null
  cartItems: CartItem[]
  onUpdateQuantity: (productId: string, newQuantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onTransactionComplete: () => void
}

export default function ShoppingCart({
  selectedStudent,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onTransactionComplete,
}: ShoppingCartProps) {
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [transactionData, setTransactionData] = useState<any>(null)
  const queryClient = useQueryClient()

  const processTransactionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || cartItems.length === 0) {
        throw new Error("No student selected or cart is empty")
      }

      const items = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          items,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to process transaction")
      }

      return response.json()
    },
    onSuccess: (transaction) => {
      const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const remainingBalance = selectedStudent!.balance - totalAmount

      setTransactionData({
        student: selectedStudent!.name,
        amount: totalAmount,
        remainingBalance,
        id: `#TXN${transaction.id.toString().padStart(6, "0")}`,
        items: cartItems,
      })

      setShowSuccessModal(true)

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })

      toast.success(`₹${totalAmount.toFixed(2)} deducted from ${selectedStudent!.name}'s account`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const canCheckout = selectedStudent && cartItems.length > 0 && selectedStudent.balance >= subtotal

  const handleProcessTransaction = () => {
    if (!canCheckout) return
    processTransactionMutation.mutate()
  }

  const handleTransactionSuccess = () => {
    setShowSuccessModal(false)
    onTransactionComplete()
  }

  return (
    <div className="space-y-6">
      {/* Shopping Cart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingCartIcon className="w-5 h-5 mr-2" />
            Shopping Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No items in cart</p>
                <p className="text-sm">Add products to get started</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-6 h-6 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-6 h-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.productId)}
                      className="text-red-500 hover:text-red-600 w-6 h-6 p-0 ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-green-500">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Balance Check */}
            {selectedStudent && cartItems.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50">
                <div className="flex justify-between text-sm">
                  <span>Current Balance:</span>
                  <span className="font-medium">₹{selectedStudent.balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>After Transaction:</span>
                  <span
                    className={`font-medium ${selectedStudent.balance >= subtotal ? "text-green-500" : "text-red-500"}`}
                  >
                    ₹{(selectedStudent.balance - subtotal).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleProcessTransaction}
                disabled={!canCheckout || processTransactionMutation.isPending}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {processTransactionMutation.isPending ? "Processing..." : "Complete Transaction"}
              </Button>

              {!canCheckout && selectedStudent && cartItems.length > 0 && selectedStudent.balance < subtotal && (
                <div className="text-center">
                  <Badge variant="destructive" className="text-xs">
                    Insufficient Balance
                  </Badge>
                </div>
              )}

              <Button variant="outline" onClick={onClearCart} disabled={cartItems.length === 0} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        transactionData={transactionData}
        onClose={handleTransactionSuccess}
      />
    </div>
  )
}
