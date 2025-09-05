import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const expressNumber = searchParams.get('number');

  if (!expressNumber) {
    return NextResponse.json({ error: '快递单号不能为空' }, { status: 400 });
  }

  try {
    // 模拟快递详细轨迹数据（基于官网的真实数据结构）
    const mockDetailData = {
      expressNumber,
      status: '已送达',
      carrier: 'FedEx',
      trackings: [
        {
          step: '制单',
          location: 'US 92337',
          description: '【Shipment information sent to FedEx-OC】',
          time: '2025-08-09 10:37',
          statusCode: 'OC'
        },
        {
          step: '提货',
          location: 'WALNUT CA US 91789',
          description: '【Picked up-PU】',
          time: '2025-08-29 08:00',
          statusCode: 'PU'
        },
        {
          step: '提货',
          location: 'WALNUT CA US 91789',
          description: '【Arrived at FedEx location-AR】',
          time: '2025-08-30 07:53',
          statusCode: 'AR'
        },
        {
          step: '运输',
          location: 'WALNUT CA US 91789',
          description: '【Left FedEx origin facility-DP】',
          time: '2025-08-30 12:07',
          statusCode: 'DP'
        },
        {
          step: '运输',
          location: 'ASH FORK AZ US 86320',
          description: '【On the way-IT】',
          time: '2025-08-31 13:08',
          statusCode: 'IT'
        },
        {
          step: '运输',
          location: 'BELEN NM US 87002',
          description: '【On the way-IT】',
          time: '2025-09-01 01:24',
          statusCode: 'IT'
        },
        {
          step: '运输',
          location: 'LACON IL US 61540',
          description: '【On the way-IT】',
          time: '2025-09-02 01:47',
          statusCode: 'IT'
        },
        {
          step: '运输',
          location: 'OLIVER TWP PA US 17074',
          description: '【On the way-IT】',
          time: '2025-09-03 02:07',
          statusCode: 'IT'
        },
        {
          step: '运输',
          location: 'JERSEY CITY NJ US 07307',
          description: '【On the way-IT】',
          time: '2025-09-04 01:07',
          statusCode: 'IT'
        },
        {
          step: '提货',
          location: 'KEASBEY NJ US 08832',
          description: '【Arrived at FedEx location-AR】',
          time: '2025-09-04 06:11',
          statusCode: 'AR'
        },
        {
          step: '提货',
          location: 'KEASBEY NJ US 08832',
          description: '【At local FedEx facility-AR】',
          time: '2025-09-04 16:44',
          statusCode: 'AR'
        },
        {
          step: '派送',
          location: 'KEASBEY NJ US 08832',
          description: '【On FedEx vehicle for delivery-OD】',
          time: '2025-09-04 16:49',
          statusCode: 'OD'
        },
        {
          step: '派送完成',
          location: 'Edison NJ US 08817',
          description: '【Delivered-DL】',
          time: '2025-09-04 22:54',
          statusCode: 'DL'
        }
      ]
    };

    return NextResponse.json(mockDetailData);

  } catch (error) {
    console.error('获取快递详情失败:', error);
    return NextResponse.json(
      { error: '获取快递详情失败' },
      { status: 500 }
    );
  }
}
