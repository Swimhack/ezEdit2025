import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

/**
 * GET /api/categories
 * Get all categories with restaurant counts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()

    // Get all active categories ordered by display_order
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, description, icon, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch categories', details: categoriesError.message },
        { status: 500 }
      )
    }

    // Get restaurant counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        // Use a join query to count active restaurants
        const { count: restaurantCount, error: countError } = await supabase
          .from('restaurant_categories')
          .select(`
            restaurant_id,
            restaurants!inner(id)
          `, { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('restaurants.is_active', true)

        if (countError && countError.code !== 'PGRST116') {
          console.error(`Error counting restaurants for category ${category.id}:`, countError)
        }

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          restaurantCount: restaurantCount || 0
        }
      })
    )

    // Better approach: Use a single query with aggregation
    const { data: categoryCounts, error: countsError } = await supabase
      .from('restaurant_categories')
      .select(`
        category_id,
        categories!inner(id, name, slug, description, icon, display_order),
        restaurants!inner(id)
      `)
      .eq('restaurants.is_active', true)
      .eq('categories.is_active', true)

    if (!countsError && categoryCounts) {
      // Group by category and count
      const countsMap = new Map<string, number>()
      categoryCounts.forEach((item: any) => {
        const catId = item.category_id || item.categories?.id
        if (catId) {
          countsMap.set(catId, (countsMap.get(catId) || 0) + 1)
        }
      })

      // Merge counts with categories
      const finalCategories = (categories || []).map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        restaurantCount: countsMap.get(category.id) || 0
      }))

      return NextResponse.json({
        success: true,
        categories: finalCategories
      })
    }

    // Fallback to individual queries if aggregation fails
    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts
    })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


