<?php

namespace App\Http\Controllers\ApiControllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request)
    {
        try {
            $query = Product::where('is_active', true);

            // Filter by Category
            if ($request->has('category') && $request->category !== 'Sumua' && $request->category !== 'Semua') {
                 $category = $request->category;
                 if ($category && $category !== 'All') {
                     $query->where('category', $category);
                 }
            }

            // Search by name - Grouped to avoid breaking is_active filter
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'ilike', "%{$search}%")
                      ->orWhere('seller_name', 'ilike', "%{$search}%");
                });
            }

            $products = $query->with('rt')->orderBy('id', 'desc')->paginate(12);

            return response()->json($products);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Production Product API Error: " . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'DEBUG ERROR: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric',
            'seller_name' => 'required|string',
            'seller_phone' => 'required|string',
            'category' => 'required|in:Kuliner,Kerajinan,Jasa,Lainnya',
            'rt_id' => 'required|exists:rts,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'maps_link' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        // Handle Image Upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            // Generate full URL
            $data['image_url'] = url('storage/' . $path);
        }

        $product = Product::create($data);

        return response()->json([
            'message' => 'Product created successfully',
            'data' => $product
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $product = Product::with('rt')->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric',
            'seller_name' => 'sometimes|required|string',
            'seller_phone' => 'sometimes|required|string',
            'category' => 'sometimes|required|in:Kuliner,Kerajinan,Jasa,Lainnya',
            'rt_id' => 'sometimes|required|exists:rts,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'maps_link' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except(['image']);

        // Handle Image Upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image_url) {
                $oldPath = str_replace(url('storage/'), '', $product->image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = url('storage/' . $path);
        }

        $product->update($data);

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        if ($product->image_url) {
            $oldPath = str_replace(url('storage/'), '', $product->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
