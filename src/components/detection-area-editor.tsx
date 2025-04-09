"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle, Trash2, Save, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Point {
  x: number
  y: number
}

interface Polygon {
  id: string
  points: Point[]
  color: string
}

export interface DetectionArea {
  id: string
  name: string
  points: Point[]
}

interface DetectionAreaEditorProps {
  imageUrl: string
  deviceId: string
  areas: DetectionArea[]
  onSave: (areas: DetectionArea[]) => Promise<void>
  onAreaComplete?: (area: Polygon) => void
  className?: string
}

export function DetectionAreaEditor({ 
  imageUrl, 
  deviceId,
  areas,
  onSave,
  onAreaComplete, 
  className = '' 
}: DetectionAreaEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null)
  const [savedPolygons, setSavedPolygons] = useState<Polygon[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null)

  // 色のリスト
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF']

  // キャンバスのサイズを画像に合わせる
  const updateCanvasSize = () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (canvas && image) {
      canvas.width = image.width
      canvas.height = image.height
    }
  }

  // 多角形を描画
  const drawPolygon = (ctx: CanvasRenderingContext2D, polygon: Polygon, isSelected: boolean = false) => {
    const { points, color } = polygon
    
    if (points.length < 2) return
    
    ctx.strokeStyle = color
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.fillStyle = isSelected ? `${color}33` : `${color}22` // 透明度
    
    // 多角形を描画
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    
    // 描画中の場合は閉じない。完成した多角形の場合は閉じる
    if (isDrawing && polygon === currentPolygon) {
      ctx.stroke()
    } else {
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    
    // 各頂点にマーカーを描画
    points.forEach((point, index) => {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(point.x, point.y, isSelected ? 5 : 4, 0, Math.PI * 2)
      ctx.fill()
      
      // 選択中の場合は頂点番号を表示
      if (isSelected) {
        ctx.fillStyle = 'white'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(index + 1), point.x, point.y)
      }
    })
    
    // エリア名を表示
    const polygonIndex = savedPolygons.findIndex(p => p.id === polygon.id)
    if (polygonIndex >= 0 && points.length > 2) {
      // 多角形の中心を計算
      let centerX = 0
      let centerY = 0
      
      points.forEach(point => {
        centerX += point.x
        centerY += point.y
      })
      
      centerX /= points.length
      centerY /= points.length
      
      // テキスト描画
      ctx.font = isSelected ? 'bold 14px Arial' : '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      const text = `エリア ${polygonIndex + 1}`
      ctx.strokeText(text, centerX, centerY)
      ctx.fillText(text, centerX, centerY)
    }
  }

  // キャンバスを再描画
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 保存済み多角形の描画
    savedPolygons.forEach(polygon => {
      const isSelected = polygon.id === selectedPolygonId
      drawPolygon(ctx, polygon, isSelected)
    })
    
    // 現在描画中の多角形を描画
    if (currentPolygon) {
      drawPolygon(ctx, currentPolygon, true)
    }
  }

  // クリックイベントハンドラ
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    // 新しい多角形の開始か、既存の多角形への点の追加か
    if (!currentPolygon) {
      // 新しい多角形を開始
      const newPolygonId = `polygon-${Date.now()}`
      const colorIndex = savedPolygons.length % colors.length
      
      setCurrentPolygon({
        id: newPolygonId,
        points: [{ x, y }],
        color: colors[colorIndex]
      })
    } else {
      // 既存の多角形に点を追加
      setCurrentPolygon(prev => {
        if (!prev) return null
        
        // 最初の点の近くをクリックすると多角形を閉じる
        const firstPoint = prev.points[0]
        const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2))
        
        if (prev.points.length > 2 && distance < 15) {
          // 多角形を閉じて完成
          handleCompletePolygon()
          return null
        }
        
        return {
          ...prev,
          points: [...prev.points, { x, y }]
        }
      })
    }
  }

  // 多角形描画の完了
  const handleCompletePolygon = () => {
    if (!currentPolygon || currentPolygon.points.length < 3) {
      toast.error('多角形には少なくとも3点が必要です')
      return
    }
    
    // 保存済み多角形に追加
    setSavedPolygons(prev => [...prev, currentPolygon])
    
    // 親コンポーネントに通知
    if (onAreaComplete) {
      onAreaComplete(currentPolygon)
    }
    
    // 完了メッセージ
    toast.success('エリアを作成しました')
    
    // 現在の多角形をクリア
    setCurrentPolygon(null)
  }

  // 新規エリア描画開始
  const handleStartDrawing = () => {
    setIsDrawing(true)
    setCurrentPolygon(null) // 既存の描画中の多角形をクリア
    toast.info('多角形を描画するには、頂点となる位置を順にクリックしてください。最初の点の近くをクリックすると多角形が完成します。')
  }

  // 描画モードの終了
  const handleFinishDrawing = () => {
    setIsDrawing(false)
    setCurrentPolygon(null)
  }
  
  // エリアの選択
  const handleSelectPolygon = (polygonId: string) => {
    setSelectedPolygonId(polygonId)
  }
  
  // エリアの削除
  const handleDeletePolygon = (polygonId: string) => {
    setSavedPolygons(prev => prev.filter(polygon => polygon.id !== polygonId))
    if (selectedPolygonId === polygonId) {
      setSelectedPolygonId(null)
    }
  }
  
  // すべてのエリアを保存
  const handleSaveAllAreas = () => {
    if (savedPolygons.length === 0) {
      toast.error('保存するエリアがありません')
      return
    }
    
    // 親コンポーネントのonSave関数に変換して渡す
    const detectionAreas: DetectionArea[] = savedPolygons.map((polygon, index) => ({
      id: polygon.id,
      name: `エリア ${index + 1}`,
      points: polygon.points
    }))
    
    // 保存処理を実行
    onSave(detectionAreas).then(() => {
      toast.success('すべてのエリアを保存しました')
    }).catch(error => {
      toast.error('エリアの保存に失敗しました')
      console.error(error)
    })
  }

  // 画像読み込み時の処理
  useEffect(() => {
    const image = new Image()
    image.src = imageUrl
    image.onload = () => {
      imageRef.current = image
      updateCanvasSize()
      redrawCanvas()
    }
  }, [imageUrl])

  // 描画状態の変更を監視して再描画
  useEffect(() => {
    redrawCanvas()
  }, [currentPolygon, savedPolygons, selectedPolygonId])

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl}
        alt="Detection area"
        className="absolute top-0 left-0 w-full h-full object-contain"
        style={{ pointerEvents: 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
      />
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <div className="flex flex-col gap-2 bg-white/80 p-2 rounded shadow">
          {!isDrawing ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleStartDrawing}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              エリアを追加
            </Button>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleCompletePolygon}
                disabled={!currentPolygon || currentPolygon.points.length < 3}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                エリア完成
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFinishDrawing}
              >
                描画モード終了
              </Button>
            </>
          )}
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAllAreas}
            disabled={savedPolygons.length === 0}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            すべて保存
          </Button>
          
          {savedPolygons.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1">作成済みエリア</p>
              <div className="max-h-40 overflow-y-auto">
                {savedPolygons.map((polygon, index) => (
                  <div 
                    key={polygon.id}
                    className={`flex items-center justify-between p-1 text-xs rounded my-1 ${selectedPolygonId === polygon.id ? 'bg-gray-200' : 'bg-white'}`}
                  >
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSelectPolygon(polygon.id)}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: polygon.color }}></div>
                      <span>エリア {index + 1}</span>
                      <span className="text-xs text-gray-500">({polygon.points.length}頂点)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeletePolygon(polygon.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 