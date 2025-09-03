import { NextRequest, NextResponse } from 'next/server';
import { statsManager } from '@/lib/database';

// 统计数据结构
interface StatsData {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  yearly: Record<string, number>;
  total: number;
  lastUpdated: string;
}





// GET - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly';
    const limit = parseInt(searchParams.get('limit') || '30');
    
    if (type === 'summary') {
      const summary = statsManager.getStatsSummary();
      return NextResponse.json({
        success: true,
        data: summary
      });
    } else if (type === 'chart' && period) {
      const chartData = statsManager.getChartData(period, limit);
      return NextResponse.json({
        success: true,
        data: chartData
      });
    } else {
      const summary = statsManager.getStatsSummary();
      return NextResponse.json({
        success: true,
        data: summary
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '获取统计数据失败'
    }, { status: 500 });
  }
}

// POST - 记录查询统计
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = body.count || 1;

    const success = statsManager.recordQuery(count);

    if (success) {
      return NextResponse.json({
        success: true,
        message: '统计记录成功',
        data: statsManager.getStatsSummary()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '统计记录失败'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '记录统计失败'
    }, { status: 500 });
  }
}
