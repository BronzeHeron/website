import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { FileSizePipe } from 'ngx-filesize';
import { PoolSize } from '../../interfaces/pool-size.interface';
import { PoolSizeChartPalette, poolSizeChartPalette } from './pool-size-chart-palette';
import { PoolSizeChartTheme } from './pool-size-chart-theme.enum';

@Component({
  selector: 'app-pool-size-chart',
  templateUrl: 'pool-size-chart.component.html',
  styleUrls: ['./pool-size-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolSizeChartComponent implements OnInit {
  @Input() sizes: PoolSize[];
  @Input() theme: PoolSizeChartTheme = PoolSizeChartTheme.Dark;
  @ViewChild('chart') chartElement: ElementRef;
  @ViewChild('linearScaleButton') linearScaleButtonElement: ElementRef;
  @ViewChild('logScaleButton') logScaleButtonElement: ElementRef;
  config: google.visualization.LineChartOptions;
  logScale: boolean;

  readonly chartBaseUnit = 1024 ** 4; // TB

  get palette(): PoolSizeChartPalette {
    return poolSizeChartPalette[this.theme];
  }

  constructor(
    private filesize: FileSizePipe,
  ) {}

  ngOnInit(): void {
    this.config = {
      curveType: 'function',
      legend: 'none',
      backgroundColor: 'transparent',
      colors: [this.palette.series],
      chartArea: {
        width: '90%',
        height: '80%',
        right: 0,
        left: 90,
      },
      hAxis: {
        viewWindowMode: 'maximized',
        textStyle: {
          color: this.palette.text,
        },
        gridlines: {
          color: this.palette.gridlines,
          count: 1,
        },
        minorGridlines: {
          color: this.palette.gridlines,
          count: 0,
        },
      },
      vAxis: {
        logScale: false,
        viewWindowMode: 'maximized',
        format: '#.#TB',
        textStyle: {
          color: this.palette.text,
        },
        gridlines: {
          color: this.palette.gridlines,
        },
        minorGridlines: {
          count: 0,
        }
      },
      pointSize: 3,
    };
    
    this.setupChart(this.config);
  }

  toggleLogScale(): void {
    this.logScale = !this.logScale;
    this.config.vAxis.logScale = this.logScale;
    this.setupChart(this.config);
  }

  private setupChart(config: google.visualization.LineChartOptions): void {
    const drawChart = () => {
      const series = this.sizes.map(({ datetime, size }) => {
        const sizeInUnits = size / this.chartBaseUnit;
        const formattedDate = format(datetime, 'LLL, do h:mm aaa');
        const formattedSize = this.filesize.transform(size) as string;
        return [
          datetime,
          sizeInUnits,
          `${formattedDate} – ${formattedSize}`,
        ];
      });
  
      const dataTable = google.visualization.arrayToDataTable([
        ['Day', 'Size', { type: 'string', role: 'tooltip' }],
        ...series,
      ]);

      const chart = new google.visualization.LineChart(this.chartElement.nativeElement);
      chart.draw(dataTable, config);
    };

    void google.charts.load('current', { packages: ['corechart'] });
    window.onresize = debounce(() => drawChart(), 500);
    google.charts.setOnLoadCallback(drawChart);
  }
}
