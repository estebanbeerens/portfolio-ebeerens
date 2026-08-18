import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeToggle } from '@portfolio-ebeerens/ui';

@Component({
  imports: [RouterModule, ThemeToggle],
  selector: 'web-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'web';
}
